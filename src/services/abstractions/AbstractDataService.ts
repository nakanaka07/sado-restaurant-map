/**
 * @fileoverview Dependency Inversion Implementation
 * 依存関係逆転原則の実装例 - サービス層抽象化
 * Phase C2: モジュール結合度最適化
 */

import type {
  ICacheProvider,
  IErrorHandler,
  IMapPointProvider,
  IValidator,
  MapPoint,
  Parking,
  Restaurant,
  Toilet,
} from "@/types";

// ==============================
// 抽象サービス基底クラス
// ==============================

/**
 * 抽象データサービス
 * 具象実装への依存を排除
 */
export abstract class AbstractDataService<T> {
  constructor(
    protected readonly dataSource: IMapPointProvider,
    protected readonly cache: ICacheProvider<T[]>,
    protected readonly errorHandler: IErrorHandler,
    protected readonly validator: IValidator<T>
  ) {}

  /**
   * データ取得（キャッシュ戦略付き）
   */
  protected async fetchWithCache(
    cacheKey: string,
    fetcher: () => Promise<T[]>
  ): Promise<T[]> {
    try {
      // キャッシュ確認
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // データ取得
      const data = await fetcher();

      // バリデーション
      const validData = data.filter(
        (item) => this.validator.validate(item).isValid
      );

      // キャッシュ保存
      await this.cache.set(cacheKey, validData, 300); // 5分間

      return validData;
    } catch (error) {
      this.errorHandler.handle(error as Error, {
        operation: "fetchWithCache",
        cacheKey,
      });
      throw error;
    }
  }

  /**
   * 抽象メソッド：具象クラスで実装
   */
  abstract getAll(): Promise<T[]>;
}

// ==============================
// マップポイントサービス実装
// ==============================

/**
 * 飲食店データサービス
 * 抽象化されたインターフェースに依存
 */
export class RestaurantService extends AbstractDataService<Restaurant> {
  async getAll(): Promise<Restaurant[]> {
    return this.fetchWithCache("restaurants", async () => {
      const mapPoints = await this.dataSource.getMapPointsByType("restaurant");
      return mapPoints.filter((point) => point.type === "restaurant");
    });
  }

  async getById(id: string): Promise<Restaurant | null> {
    const restaurants = await this.getAll();
    return restaurants.find((r) => r.id === id) || null;
  }

  async getNearby(
    center: google.maps.LatLngLiteral,
    radius: number
  ): Promise<Restaurant[]> {
    const nearby = await this.dataSource.searchNearby(center, radius);
    return nearby.filter((point) => point.type === "restaurant");
  }
}

/**
 * 駐車場データサービス
 */
export class ParkingService extends AbstractDataService<Parking> {
  async getAll(): Promise<Parking[]> {
    return this.fetchWithCache("parkings", async () => {
      const mapPoints = await this.dataSource.getMapPointsByType("parking");
      return mapPoints.filter((point) => point.type === "parking");
    });
  }
}

/**
 * トイレデータサービス
 */
export class ToiletService extends AbstractDataService<Toilet> {
  async getAll(): Promise<Toilet[]> {
    return this.fetchWithCache("toilets", async () => {
      const mapPoints = await this.dataSource.getMapPointsByType("toilet");
      return mapPoints.filter((point) => point.type === "toilet");
    });
  }
}

// ==============================
// サービスファクトリー
// ==============================

/**
 * サービス依存関係注入ファクトリー
 */
export class ServiceFactory {
  constructor(
    private readonly mapPointProvider: IMapPointProvider,
    private readonly cacheProvider: ICacheProvider<unknown>,
    private readonly errorHandler: IErrorHandler,
    private readonly restaurantValidator: IValidator<Restaurant>,
    private readonly parkingValidator: IValidator<Parking>,
    private readonly toiletValidator: IValidator<Toilet>
  ) {}

  createRestaurantService(): RestaurantService {
    return new RestaurantService(
      this.mapPointProvider,
      this.cacheProvider as ICacheProvider<Restaurant[]>,
      this.errorHandler,
      this.restaurantValidator
    );
  }

  createParkingService(): ParkingService {
    return new ParkingService(
      this.mapPointProvider,
      this.cacheProvider as ICacheProvider<Parking[]>,
      this.errorHandler,
      this.parkingValidator
    );
  }

  createToiletService(): ToiletService {
    return new ToiletService(
      this.mapPointProvider,
      this.cacheProvider as ICacheProvider<Toilet[]>,
      this.errorHandler,
      this.toiletValidator
    );
  }
}

// ==============================
// 統合マップデータサービス
// ==============================

/**
 * 統合マップデータサービス
 * 複数のサービスを協調させる高レベルサービス
 */
export class MapDataService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly parkingService: ParkingService,
    private readonly toiletService: ToiletService
  ) {}

  /**
   * 全マップポイント取得
   */
  async getAllMapPoints(): Promise<MapPoint[]> {
    const [restaurants, parkings, toilets] = await Promise.all([
      this.restaurantService.getAll(),
      this.parkingService.getAll(),
      this.toiletService.getAll(),
    ]);

    return [...restaurants, ...parkings, ...toilets];
  }

  /**
   * エリア内マップポイント取得
   */
  async getMapPointsInArea(
    center: google.maps.LatLngLiteral,
    radius: number
  ): Promise<MapPoint[]> {
    const [restaurants, parkings, toilets] = await Promise.all([
      this.restaurantService.getNearby(center, radius),
      this.parkingService.getAll(), // 駐車場は全体から距離フィルタリング
      this.toiletService.getAll(), // トイレも全体から距離フィルタリング
    ]);

    // 距離ベースフィルタリング（駐車場・トイレ用）
    const filteredParkings = this.filterByDistance(parkings, center, radius);
    const filteredToilets = this.filterByDistance(toilets, center, radius);

    return [...restaurants, ...filteredParkings, ...filteredToilets];
  }

  /**
   * 距離ベースフィルタリング
   */
  private filterByDistance(
    points: MapPoint[],
    center: google.maps.LatLngLiteral,
    radius: number
  ): MapPoint[] {
    return points.filter((point) => {
      const distance = this.calculateDistance(center, point);
      return distance <= radius;
    });
  }

  /**
   * 距離計算（Haversine公式）
   */
  private calculateDistance(
    point1: google.maps.LatLngLiteral,
    point2: MapPoint
  ): number {
    const R = 6371; // 地球の半径（km）
    const coord2 =
      "coordinates" in point2 ? point2.coordinates : { lat: 0, lng: 0 };
    const dLat = this.degToRad(coord2.lat - point1.lat);
    const dLng = this.degToRad(coord2.lng - point1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(point1.lat)) *
        Math.cos(this.degToRad(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
