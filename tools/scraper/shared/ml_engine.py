"""
Machine Learning Engine for Data Quality Analysis

Advanced ML implementation for data quality analysis,
anomaly detection, and processing optimization.
"""

import logging
import os
import pickle
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import re
from pathlib import Path

# Scikit-learn imports
try:
    from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, mean_squared_error
    from sklearn.cluster import DBSCAN
    from sklearn.feature_extraction.text import TfidfVectorizer
    SKLEARN_AVAILABLE = True
except ImportError:
    logging.warning("scikit-learn not available. Fallback to basic implementation.")
    SKLEARN_AVAILABLE = False


@dataclass
class QualityMetrics:
    """データ品質メトリクス"""
    overall_score: float
    completeness: float
    accuracy: float
    consistency: float
    timeliness: float
    anomaly_score: float
    confidence: float = 0.0
    details: Dict[str, Any] = None

    def __post_init__(self):
        if self.details is None:
            self.details = {}


@dataclass
class MLPrediction:
    """ML予測結果"""
    prediction: Any
    confidence: float
    explanation: str
    timestamp: datetime
    model_version: str = "v1.0"
    features_used: List[str] = None

    def __post_init__(self):
        if self.features_used is None:
            self.features_used = []


@dataclass
class AnomalyReport:
    """異常検知レポート"""
    is_anomaly: bool
    anomaly_score: float
    anomaly_type: str
    severity: str
    explanation: str
    suggested_actions: List[str]
    confidence: float


class MLEngine:
    """機械学習統合エンジン（本格実装）"""

    def __init__(self, model_dir: str = "models"):
        self.logger = logging.getLogger(__name__)
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True)

        # モデル状態
        self.models_loaded = False
        self.default_quality_score = 0.8
        self.anomaly_threshold = 0.3

        # 機械学習モデル
        self.quality_classifier = None
        self.anomaly_detector = None
        self.processing_time_predictor = None
        self.pattern_analyzer = None

        # 前処理器
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.text_vectorizer = TfidfVectorizer(max_features=100) if SKLEARN_AVAILABLE else None
        self.label_encoder = LabelEncoder() if SKLEARN_AVAILABLE else None

        # 統計データ
        self.quality_history = []
        self.processing_history = []
        self.feature_importances = {}

        self.logger.info("MLEngine初期化（本格実装版）")
        self._initialize_models()

    def _initialize_models(self):
        """モデル初期化"""
        try:
            if SKLEARN_AVAILABLE:
                self._load_models()
                if not self.models_loaded:
                    self._create_models()
                    self._train_initial_models()
            else:
                self.logger.warning("scikit-learn未使用: 基本実装モードで起動")

        except Exception as e:
            self.logger.error(f"モデル初期化エラー: {e}")

    def _load_models(self):
        """事前学習済みモデル読み込み"""
        try:
            model_files = {
                'quality_classifier': 'quality_classifier.pkl',
                'anomaly_detector': 'anomaly_detector.pkl',
                'processing_time_predictor': 'processing_time_predictor.pkl',
                'scaler': 'scaler.pkl',
                'text_vectorizer': 'text_vectorizer.pkl'
            }

            loaded_models = {}
            for model_name, filename in model_files.items():
                filepath = self.model_dir / filename
                if filepath.exists():
                    with open(filepath, 'rb') as f:
                        loaded_models[model_name] = pickle.load(f)

            if loaded_models:
                self.quality_classifier = loaded_models.get('quality_classifier')
                self.anomaly_detector = loaded_models.get('anomaly_detector')
                self.processing_time_predictor = loaded_models.get('processing_time_predictor')
                self.scaler = loaded_models.get('scaler', self.scaler)
                self.text_vectorizer = loaded_models.get('text_vectorizer', self.text_vectorizer)

                self.models_loaded = True
                self.logger.info(f"モデル読み込み完了: {len(loaded_models)}個")

        except Exception as e:
            self.logger.warning(f"モデル読み込み失敗: {e}")

    def _create_models(self):
        """新規モデル作成"""
        if not SKLEARN_AVAILABLE:
            return

        try:
            # データ品質分類器
            self.quality_classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )

            # 異常検知器
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100
            )

            # 処理時間予測器
            self.processing_time_predictor = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )

            self.logger.info("新規モデル作成完了")

        except Exception as e:
            self.logger.error(f"モデル作成エラー: {e}")

    def _train_initial_models(self):
        """初期モデル学習（サンプルデータを使用）"""
        if not SKLEARN_AVAILABLE or not all([self.quality_classifier, self.anomaly_detector]):
            return

        try:
            # サンプルデータ生成
            sample_data = self._generate_sample_training_data()

            if sample_data:
                X_quality, y_quality = sample_data['quality_data']
                X_anomaly = sample_data['anomaly_data']
                X_timing, y_timing = sample_data['timing_data']

                # 品質分類器の学習
                X_train, X_test, y_train, y_test = train_test_split(
                    X_quality, y_quality, test_size=0.2, random_state=42
                )

                self.scaler.fit(X_train)
                X_train_scaled = self.scaler.transform(X_train)
                X_test_scaled = self.scaler.transform(X_test)

                self.quality_classifier.fit(X_train_scaled, y_train)

                # 評価
                y_pred = self.quality_classifier.predict(X_test_scaled)
                self.logger.info(f"品質分類器性能:\n{classification_report(y_test, y_pred)}")

                # 異常検知器の学習
                X_anomaly_scaled = self.scaler.transform(X_anomaly)
                self.anomaly_detector.fit(X_anomaly_scaled)

                # 処理時間予測器の学習
                if len(X_timing) > 0:
                    self.processing_time_predictor.fit(X_timing, y_timing)
                    y_timing_pred = self.processing_time_predictor.predict(X_timing)
                    mse = mean_squared_error(y_timing, y_timing_pred)
                    self.logger.info(f"処理時間予測器MSE: {mse:.2f}")

                # モデル保存
                self._save_models()

                self.logger.info("初期モデル学習完了")

        except Exception as e:
            self.logger.error(f"初期学習エラー: {e}")

    def _save_models(self):
        """モデル保存"""
        try:
            models_to_save = {
                'quality_classifier': self.quality_classifier,
                'anomaly_detector': self.anomaly_detector,
                'processing_time_predictor': self.processing_time_predictor,
                'scaler': self.scaler,
                'text_vectorizer': self.text_vectorizer
            }

            for model_name, model in models_to_save.items():
                if model is not None:
                    filepath = self.model_dir / f"{model_name}.pkl"
                    with open(filepath, 'wb') as f:
                        pickle.dump(model, f)

            self.logger.info("モデル保存完了")

        except Exception as e:
            self.logger.error(f"モデル保存エラー: {e}")

    def _generate_sample_training_data(self) -> Dict[str, Any]:
        """サンプル学習データ生成"""
        try:
            # 品質分類用データ
            quality_features = []
            quality_labels = []

            # 高品質データ例
            for _ in range(100):
                features = [
                    np.random.uniform(0.8, 1.0),  # completeness
                    np.random.uniform(0.7, 1.0),  # field_count
                    np.random.uniform(0.8, 1.0),  # validity
                    np.random.uniform(10, 100),   # name_length
                    np.random.uniform(10, 200),   # address_length
                    np.random.uniform(0.9, 1.0),  # freshness
                ]
                quality_features.append(features)
                quality_labels.append(1)  # 高品質

            # 低品質データ例
            for _ in range(100):
                features = [
                    np.random.uniform(0.0, 0.5),  # completeness
                    np.random.uniform(0.0, 0.5),  # field_count
                    np.random.uniform(0.0, 0.6),  # validity
                    np.random.uniform(0, 10),     # name_length
                    np.random.uniform(0, 20),     # address_length
                    np.random.uniform(0.0, 0.5),  # freshness
                ]
                quality_features.append(features)
                quality_labels.append(0)  # 低品質

            # 異常検知用データ（正常データのみ）
            anomaly_features = quality_features[:150]  # 正常データ

            # 処理時間予測用データ
            timing_features = []
            timing_labels = []

            for _ in range(200):
                query_count = np.random.randint(10, 1000)
                complexity = np.random.uniform(0.1, 1.0)
                worker_count = np.random.randint(1, 8)

                # 処理時間 = ベース時間 × 複雑度 / ワーカー数
                base_time = query_count * 1.5
                processing_time = (base_time * complexity) / worker_count + np.random.normal(0, 5)

                timing_features.append([query_count, complexity, worker_count])
                timing_labels.append(max(0, processing_time))

            return {
                'quality_data': (np.array(quality_features), np.array(quality_labels)),
                'anomaly_data': np.array(anomaly_features),
                'timing_data': (np.array(timing_features), np.array(timing_labels))
            }

        except Exception as e:
            self.logger.error(f"サンプルデータ生成エラー: {e}")
            return {}

    def analyze_data_quality(self, data_batch: List[Dict]) -> List[QualityMetrics]:
        """データ品質スコア算出（本格実装）"""
        try:
            quality_metrics = []

            for item in data_batch:
                # 基本品質メトリクス計算
                completeness = self._calculate_completeness(item)
                accuracy = self._calculate_accuracy(item)
                consistency = self._calculate_consistency(item)
                timeliness = self._calculate_timeliness(item)

                # ML予測（利用可能な場合）
                if SKLEARN_AVAILABLE and self.quality_classifier is not None and self.scaler is not None:
                    features = self._extract_quality_features(item)
                    features_scaled = self.scaler.transform([features])

                    # 品質予測
                    quality_proba = self.quality_classifier.predict_proba(features_scaled)[0]
                    ml_score = quality_proba[1]  # 高品質の確率
                    confidence = max(quality_proba)

                    # 異常スコア
                    anomaly_score = self.anomaly_detector.decision_function([features_scaled[0]])[0]
                    anomaly_score = max(0, min(1, (anomaly_score + 0.5) * 2))  # 正規化

                else:
                    # フォールバック実装
                    ml_score = self._calculate_basic_quality_score(item)
                    confidence = 0.7
                    anomaly_score = 0.1 if not self._detect_basic_anomaly(item) else 0.8

                # 総合スコア計算
                overall_score = (
                    completeness * 0.25 +
                    accuracy * 0.25 +
                    consistency * 0.20 +
                    timeliness * 0.15 +
                    ml_score * 0.15
                )

                # 詳細情報
                details = {
                    'ml_prediction': ml_score,
                    'feature_scores': {
                        'completeness': completeness,
                        'accuracy': accuracy,
                        'consistency': consistency,
                        'timeliness': timeliness
                    },
                    'validation_checks': self._run_validation_checks(item)
                }

                metrics = QualityMetrics(
                    overall_score=overall_score,
                    completeness=completeness,
                    accuracy=accuracy,
                    consistency=consistency,
                    timeliness=timeliness,
                    anomaly_score=anomaly_score,
                    confidence=confidence,
                    details=details
                )

                quality_metrics.append(metrics)

            # 統計情報ログ
            avg_score = sum(m.overall_score for m in quality_metrics) / len(quality_metrics)
            self.logger.debug(f"品質分析完了: {len(data_batch)}件, 平均スコア={avg_score:.3f}")

            # 履歴に追加
            self.quality_history.extend(quality_metrics)
            if len(self.quality_history) > 1000:  # 履歴上限
                self.quality_history = self.quality_history[-1000:]

            return quality_metrics

        except Exception as e:
            self.logger.error(f"品質分析エラー: {e}")
            # フォールバック
            return [QualityMetrics(
                overall_score=self.default_quality_score,
                completeness=0.8,
                accuracy=0.8,
                consistency=0.8,
                timeliness=0.8,
                anomaly_score=0.1,
                confidence=0.5
            ) for _ in data_batch]

    def _calculate_completeness(self, item: Dict) -> float:
        """データ完全性スコア計算"""
        try:
            required_fields = ['place_id', 'name', 'formatted_address']
            optional_fields = ['rating', 'user_ratings_total', 'price_level',
                             'phone_number', 'website', 'opening_hours']

            # 必須フィールドスコア
            required_score = sum(1 for field in required_fields if item.get(field)) / len(required_fields)

            # オプショナルフィールドスコア
            optional_score = sum(1 for field in optional_fields if item.get(field)) / len(optional_fields)

            # 重み付き平均
            completeness = required_score * 0.7 + optional_score * 0.3

            return min(1.0, completeness)

        except Exception:
            return 0.5

    def _calculate_accuracy(self, item: Dict) -> float:
        """データ正確性スコア計算"""
        try:
            accuracy_score = 1.0

            # 評価値の妥当性
            if 'rating' in item:
                try:
                    rating = float(item['rating'])
                    if not (1.0 <= rating <= 5.0):
                        accuracy_score -= 0.2
                except (ValueError, TypeError):
                    accuracy_score -= 0.3

            # 電話番号の形式
            if 'phone_number' in item:
                phone = str(item['phone_number'])
                # 日本の電話番号パターン（簡易版）
                if not re.match(r'^[\+\d\-\(\)\s]+$', phone):
                    accuracy_score -= 0.2

            # ウェブサイトURL
            if 'website' in item:
                website = str(item['website'])
                if not re.match(r'^https?://', website):
                    accuracy_score -= 0.2

            # 名前の妥当性
            name = item.get('name', '')
            if len(name) < 2 or len(name) > 200:
                accuracy_score -= 0.3

            return max(0.0, accuracy_score)

        except Exception:
            return 0.5

    def _calculate_consistency(self, item: Dict) -> float:
        """データ一貫性スコア計算"""
        try:
            consistency_score = 1.0

            # 名前と住所の関連性チェック
            name = item.get('name', '').lower()
            address = item.get('formatted_address', '').lower()

            # 佐渡島関連チェック
            sado_keywords = ['佐渡', 'sado', '両津', '相川', '新潟']
            if address and not any(keyword in address for keyword in sado_keywords):
                consistency_score -= 0.3

            # 評価数と評価値の一貫性
            rating = item.get('rating')
            total_ratings = item.get('user_ratings_total')

            if rating and total_ratings:
                try:
                    rating_f = float(rating)
                    total_f = int(total_ratings)

                    # 評価が高いのに評価数が極端に少ない場合
                    if rating_f > 4.5 and total_f < 5:
                        consistency_score -= 0.1
                    # 評価が低いのに評価数が多い場合は正常とみなす

                except (ValueError, TypeError):
                    consistency_score -= 0.2

            return max(0.0, consistency_score)

        except Exception:
            return 0.5

    def _calculate_timeliness(self, item: Dict) -> float:
        """データ新鮮度スコア計算"""
        try:
            # 更新日時が利用可能な場合
            if 'updated_at' in item:
                try:
                    updated_time = datetime.fromisoformat(
                        item['updated_at'].replace('Z', '+00:00')
                    )
                    now = datetime.now()
                    hours_elapsed = (now - updated_time).total_seconds() / 3600

                    # 24時間以内は1.0、その後指数的に減少
                    timeliness = max(0.0, np.exp(-hours_elapsed / 24))
                    return timeliness

                except (ValueError, TypeError):
                    pass

            # デフォルト値（中程度の新鮮度）
            return 0.7

        except Exception:
            return 0.5

    def _extract_quality_features(self, item: Dict) -> List[float]:
        """品質評価用特徴量抽出"""
        try:
            features = []

            # 基本完全性
            required_fields = ['place_id', 'name', 'formatted_address']
            completeness = sum(1 for field in required_fields if item.get(field)) / len(required_fields)
            features.append(completeness)

            # フィールド数
            non_empty_fields = sum(1 for v in item.values() if v)
            features.append(min(1.0, non_empty_fields / 10))

            # 文字列長度指標
            name_length = len(item.get('name', ''))
            address_length = len(item.get('formatted_address', ''))
            features.extend([
                min(1.0, name_length / 50),
                min(1.0, address_length / 100)
            ])

            # 評価関連
            if 'rating' in item:
                try:
                    rating = float(item['rating'])
                    features.append(rating / 5.0)
                except:
                    features.append(0.0)
            else:
                features.append(0.0)

            # 新鮮度
            timeliness = self._calculate_timeliness(item)
            features.append(timeliness)

            return features

        except Exception as e:
            self.logger.debug(f"特徴量抽出エラー: {e}")
            return [0.5] * 6  # デフォルト特徴量

    def _run_validation_checks(self, item: Dict) -> Dict[str, bool]:
        """バリデーションチェック実行"""
        checks = {}

        try:
            # 必須フィールドチェック
            checks['has_place_id'] = bool(item.get('place_id'))
            checks['has_name'] = bool(item.get('name'))
            checks['has_address'] = bool(item.get('formatted_address'))

            # 形式チェック
            checks['valid_rating'] = True
            if 'rating' in item:
                try:
                    rating = float(item['rating'])
                    checks['valid_rating'] = 1.0 <= rating <= 5.0
                except:
                    checks['valid_rating'] = False

            # 地理的チェック
            address = item.get('formatted_address', '').lower()
            checks['location_consistent'] = any(
                keyword in address for keyword in ['佐渡', 'sado', '新潟']
            )

            return checks

        except Exception:
            return {}

    def detect_anomalies(self, data_batch: List[Dict]) -> List[AnomalyReport]:
        """高度な異常データ検知"""
        try:
            anomaly_reports = []

            for item in data_batch:
                # 基本的な異常チェック
                basic_anomalies = self._detect_basic_anomalies(item)

                # ML異常検知（利用可能な場合）
                ml_anomaly_score = 0.0
                if SKLEARN_AVAILABLE and self.anomaly_detector is not None and self.scaler is not None:
                    features = self._extract_quality_features(item)
                    features_scaled = self.scaler.transform([features])
                    anomaly_decision = self.anomaly_detector.decision_function(features_scaled)[0]

                    # スコア正規化（-1〜1を0〜1に変換）
                    ml_anomaly_score = max(0, min(1, (1 - anomaly_decision) / 2))

                # 統計的異常検知
                statistical_anomalies = self._detect_statistical_anomalies(item)

                # パターン異常検知
                pattern_anomalies = self._detect_pattern_anomalies(item)

                # 異常レベル統合判定
                all_anomalies = basic_anomalies + statistical_anomalies + pattern_anomalies

                if all_anomalies or ml_anomaly_score > self.anomaly_threshold:
                    # 最も重要な異常を選択
                    primary_anomaly = max(all_anomalies, key=lambda x: x['severity_score']) if all_anomalies else None

                    if primary_anomaly:
                        anomaly_type = primary_anomaly['type']
                        severity = primary_anomaly['severity']
                        explanation = primary_anomaly['explanation']
                        suggested_actions = primary_anomaly['actions']
                        confidence = primary_anomaly['confidence']
                    else:
                        # MLのみで検知された場合
                        anomaly_type = "ml_detected"
                        severity = "medium" if ml_anomaly_score > 0.7 else "low"
                        explanation = f"機械学習モデルが異常を検知 (スコア: {ml_anomaly_score:.3f})"
                        suggested_actions = ["データの再検証を推奨", "追加の品質チェック"]
                        confidence = ml_anomaly_score

                    report = AnomalyReport(
                        is_anomaly=True,
                        anomaly_score=max(ml_anomaly_score, primary_anomaly['severity_score'] if primary_anomaly else 0),
                        anomaly_type=anomaly_type,
                        severity=severity,
                        explanation=explanation,
                        suggested_actions=suggested_actions,
                        confidence=confidence
                    )
                else:
                    # 正常データ
                    report = AnomalyReport(
                        is_anomaly=False,
                        anomaly_score=ml_anomaly_score,
                        anomaly_type="normal",
                        severity="none",
                        explanation="異常は検出されませんでした",
                        suggested_actions=[],
                        confidence=1.0 - ml_anomaly_score
                    )

                anomaly_reports.append(report)

            # 統計ログ
            anomaly_count = sum(1 for r in anomaly_reports if r.is_anomaly)
            self.logger.debug(f"異常検知完了: {anomaly_count}/{len(data_batch)}件が異常")

            return anomaly_reports

        except Exception as e:
            self.logger.error(f"異常検知エラー: {e}")
            # フォールバック
            return [AnomalyReport(
                is_anomaly=False,
                anomaly_score=0.1,
                anomaly_type="error",
                severity="none",
                explanation="異常検知エラーが発生しました",
                suggested_actions=["システム管理者に連絡"],
                confidence=0.0
            ) for _ in data_batch]

    def _detect_basic_anomalies(self, item: Dict) -> List[Dict[str, Any]]:
        """基本的な異常検知"""
        anomalies = []

        try:
            # 必須フィールド欠損
            if not item.get('place_id'):
                anomalies.append({
                    'type': 'missing_critical_field',
                    'severity': 'high',
                    'severity_score': 0.9,
                    'explanation': 'place_idが欠損しています',
                    'actions': ['データソースの確認', '再取得の実行'],
                    'confidence': 1.0
                })

            if not item.get('name'):
                anomalies.append({
                    'type': 'missing_critical_field',
                    'severity': 'high',
                    'severity_score': 0.9,
                    'explanation': '店舗名が欠損しています',
                    'actions': ['データソースの確認', '手動データ補完'],
                    'confidence': 1.0
                })

            # 評価値の異常
            if 'rating' in item:
                try:
                    rating = float(item['rating'])
                    if not (1.0 <= rating <= 5.0):
                        anomalies.append({
                            'type': 'invalid_rating',
                            'severity': 'medium',
                            'severity_score': 0.7,
                            'explanation': f'無効な評価値: {rating}',
                            'actions': ['評価値の修正', 'データソースの確認'],
                            'confidence': 1.0
                        })
                except (ValueError, TypeError):
                    anomalies.append({
                        'type': 'invalid_rating_format',
                        'severity': 'medium',
                        'severity_score': 0.6,
                        'explanation': '評価値の形式が不正です',
                        'actions': ['形式の修正', 'データ変換処理'],
                        'confidence': 1.0
                    })

            # 名前の異常
            name = item.get('name', '')
            if len(name) < 2:
                anomalies.append({
                    'type': 'invalid_name_length',
                    'severity': 'medium',
                    'severity_score': 0.6,
                    'explanation': '店舗名が短すぎます',
                    'actions': ['店舗名の確認', 'データ補完'],
                    'confidence': 0.9
                })
            elif len(name) > 200:
                anomalies.append({
                    'type': 'invalid_name_length',
                    'severity': 'low',
                    'severity_score': 0.4,
                    'explanation': '店舗名が長すぎます',
                    'actions': ['店舗名の確認', '切り詰め処理'],
                    'confidence': 0.8
                })

            return anomalies

        except Exception as e:
            self.logger.debug(f"基本異常検知エラー: {e}")
            return []

    def _detect_statistical_anomalies(self, item: Dict) -> List[Dict[str, Any]]:
        """統計的異常検知"""
        anomalies = []

        try:
            # 履歴データがある場合の統計的チェック
            if len(self.quality_history) > 10:
                # 品質スコア分布に基づく異常検知
                quality_scores = [m.overall_score for m in self.quality_history[-100:]]
                mean_quality = np.mean(quality_scores)
                std_quality = np.std(quality_scores)

                current_quality = self._calculate_basic_quality_score(item)
                z_score = abs(current_quality - mean_quality) / (std_quality + 1e-8)

                if z_score > 2.5:  # 2.5σ以上の外れ値
                    anomalies.append({
                        'type': 'statistical_outlier',
                        'severity': 'medium' if z_score > 3.0 else 'low',
                        'severity_score': min(0.8, z_score / 4.0),
                        'explanation': f'品質スコアが統計的に異常 (Z-score: {z_score:.2f})',
                        'actions': ['詳細検証', '品質要因分析'],
                        'confidence': min(1.0, z_score / 3.0)
                    })

            # 評価数と評価値の相関異常
            rating = item.get('rating')
            user_ratings_total = item.get('user_ratings_total')

            if rating and user_ratings_total:
                try:
                    rating_f = float(rating)
                    total_f = int(user_ratings_total)

                    # 高評価なのに評価数が極端に少ない
                    if rating_f > 4.5 and total_f < 3:
                        anomalies.append({
                            'type': 'rating_inconsistency',
                            'severity': 'low',
                            'severity_score': 0.3,
                            'explanation': '高評価だが評価数が少ない',
                            'actions': ['評価の確認', '追加調査'],
                            'confidence': 0.7
                        })

                    # 評価数が異常に多い（スパム可能性）
                    if total_f > 10000:
                        anomalies.append({
                            'type': 'excessive_ratings',
                            'severity': 'medium',
                            'severity_score': 0.5,
                            'explanation': '評価数が異常に多い',
                            'actions': ['スパムチェック', 'データ検証'],
                            'confidence': 0.8
                        })

                except (ValueError, TypeError):
                    pass

            return anomalies

        except Exception as e:
            self.logger.debug(f"統計的異常検知エラー: {e}")
            return []

    def _detect_pattern_anomalies(self, item: Dict) -> List[Dict[str, Any]]:
        """パターン異常検知"""
        anomalies = []

        try:
            # 地理的整合性チェック
            address = item.get('formatted_address', '').lower()
            name = item.get('name', '').lower()

            # 佐渡島外の住所パターン
            sado_patterns = ['佐渡', 'sado', '両津', '相川', '金井', '畑野', '真野', '小木', '羽茂', '赤泊']
            niigata_patterns = ['新潟', 'niigata']

            if address:
                has_sado = any(pattern in address for pattern in sado_patterns)
                has_niigata = any(pattern in address for pattern in niigata_patterns)

                if not (has_sado or has_niigata):
                    anomalies.append({
                        'type': 'geographic_inconsistency',
                        'severity': 'high',
                        'severity_score': 0.8,
                        'explanation': '佐渡島外の住所が検出されました',
                        'actions': ['住所の再確認', '地理的フィルタリング'],
                        'confidence': 0.9
                    })

            # 店舗名パターン異常
            suspicious_patterns = [
                r'^test', r'テスト', r'sample', r'サンプル',
                r'^\d+$',  # 数字のみ
                r'^[a-zA-Z]$',  # 単一文字
                r'(spam|fake|bot)',
                r'(スパム|偽|ボット)'
            ]

            for pattern in suspicious_patterns:
                if re.search(pattern, name, re.IGNORECASE):
                    anomalies.append({
                        'type': 'suspicious_name_pattern',
                        'severity': 'medium',
                        'severity_score': 0.6,
                        'explanation': f'疑わしい店舗名パターン: {pattern}',
                        'actions': ['店舗名の検証', 'データソース確認'],
                        'confidence': 0.8
                    })
                    break

            # 営業時間パターン異常
            if 'opening_hours' in item:
                hours = item['opening_hours']
                if isinstance(hours, dict) and 'weekday_text' in hours:
                    weekday_text = str(hours['weekday_text'])

                    # 24時間営業の異常パターン
                    if '24時間' in weekday_text or '24 hours' in weekday_text.lower():
                        # レストランで24時間営業は珍しい
                        anomalies.append({
                            'type': 'unusual_opening_hours',
                            'severity': 'low',
                            'severity_score': 0.3,
                            'explanation': '24時間営業のレストランは珍しいです',
                            'actions': ['営業時間の確認', '業態の確認'],
                            'confidence': 0.6
                        })

            return anomalies

        except Exception as e:
            self.logger.debug(f"パターン異常検知エラー: {e}")
            return []

    def generate_recommendations(self, quality_scores: List[float]) -> List[str]:
        """品質改善推奨事項生成（プレースホルダー）"""

        try:
            recommendations = []

            for score in quality_scores:
                recommendation = self._generate_basic_recommendation(score)
                recommendations.append(recommendation)

            return recommendations

        except Exception as e:
            self.logger.error(f"推奨事項生成エラー: {e}")
            return ["品質分析エラー"] * len(quality_scores)

    def predict_processing_time(
        self,
        query_count: int,
        data_complexity: float,
        worker_count: int = 1
    ) -> MLPrediction:
        """高度な処理時間予測"""
        try:
            # ML予測（利用可能な場合）
            if SKLEARN_AVAILABLE and self.processing_time_predictor is not None:
                features = np.array([[query_count, data_complexity, worker_count]])
                predicted_time = self.processing_time_predictor.predict(features)[0]

                # 信頼度計算（特徴量からの距離ベース）
                confidence = self._calculate_prediction_confidence(features[0])

                explanation = f"ML予測: {query_count}件, 複雑度{data_complexity:.2f}, {worker_count}ワーカー"

            else:
                # フォールバック予測
                base_time = query_count * 1.2  # 基本処理時間（秒）
                complexity_factor = 1 + (data_complexity * 0.5)
                worker_factor = 1.0 / worker_count
                predicted_time = base_time * complexity_factor * worker_factor

                confidence = 0.7
                explanation = f"ヒューリスティック予測: {query_count}件, 複雑度{data_complexity:.2f}"

            # 履歴ベースの調整
            if self.processing_history:
                historical_adjustment = self._get_historical_adjustment()
                predicted_time *= historical_adjustment
                explanation += f" (履歴調整係数: {historical_adjustment:.2f})"

            prediction = MLPrediction(
                prediction=max(0, predicted_time),
                confidence=confidence,
                explanation=explanation,
                timestamp=datetime.now(),
                model_version="v1.0",
                features_used=['query_count', 'data_complexity', 'worker_count']
            )

            self.logger.debug(f"処理時間予測: {predicted_time:.1f}秒 (信頼度: {confidence:.2f})")
            return prediction

        except Exception as e:
            self.logger.error(f"処理時間予測エラー: {e}")

            # エラー時のフォールバック
            fallback_time = query_count * 2.0
            return MLPrediction(
                prediction=fallback_time,
                confidence=0.3,
                explanation=f"フォールバック予測 (エラー: {str(e)})",
                timestamp=datetime.now()
            )

    def optimize_batch_size(
        self,
        total_queries: int,
        available_workers: int,
        target_duration: float = 300.0  # 5分
    ) -> Dict[str, Any]:
        """高度なバッチサイズ最適化"""
        try:
            # 履歴データからの学習
            optimal_size = 50  # デフォルト

            if self.processing_history:
                # 過去の成功パターンから学習
                successful_batches = [
                    job for job in self.processing_history
                    if job.get('status') == 'success' and job.get('batch_size') and job.get('duration')
                ]

                if successful_batches:
                    # 目標時間内に完了したバッチを分析
                    fast_batches = [
                        job for job in successful_batches
                        if job['duration'] <= target_duration
                    ]

                    if fast_batches:
                        batch_sizes = [job['batch_size'] for job in fast_batches]
                        optimal_size = int(np.median(batch_sizes))

            # ワーカー数に基づく調整
            if available_workers >= 8:
                optimal_size = min(optimal_size, 30)  # 高並列時は小さめ
            elif available_workers <= 2:
                optimal_size = max(optimal_size, 80)  # 低並列時は大きめ

            # 総クエリ数に基づく調整
            if total_queries < optimal_size:
                optimal_size = total_queries

            # 推定値計算
            estimated_batches = (total_queries + optimal_size - 1) // optimal_size
            estimated_total_time = self.predict_processing_time(
                total_queries, 0.5, available_workers
            ).prediction

            # 効率性評価
            efficiency_score = self._calculate_batch_efficiency(
                optimal_size, estimated_batches, available_workers
            )

            result = {
                "optimal_batch_size": optimal_size,
                "estimated_batches": estimated_batches,
                "estimated_total_time": estimated_total_time,
                "efficiency_score": efficiency_score,
                "confidence": 0.8 if self.processing_history else 0.6,
                "reasoning": self._generate_batch_size_reasoning(
                    optimal_size, available_workers, total_queries
                )
            }

            self.logger.debug(
                f"バッチサイズ最適化: {optimal_size} "
                f"(クエリ={total_queries}, ワーカー={available_workers})"
            )
            return result

        except Exception as e:
            self.logger.error(f"バッチサイズ最適化エラー: {e}")

            # フォールバック
            fallback_size = max(10, min(100, total_queries // available_workers))
            return {
                "optimal_batch_size": fallback_size,
                "estimated_batches": (total_queries + fallback_size - 1) // fallback_size,
                "estimated_total_time": total_queries * 2.0,
                "efficiency_score": 0.5,
                "confidence": 0.3,
                "reasoning": "フォールバック値（エラーのため）"
            }

    def generate_recommendations(self, quality_metrics: List[QualityMetrics]) -> List[Dict[str, Any]]:
        """高度な推奨事項生成"""
        try:
            recommendations = []

            if not quality_metrics:
                return recommendations

            # 品質スコア統計
            overall_scores = [m.overall_score for m in quality_metrics]
            avg_score = np.mean(overall_scores)
            min_score = np.min(overall_scores)

            # 低品質データの推奨事項
            low_quality_count = sum(1 for score in overall_scores if score < 0.6)
            if low_quality_count > 0:
                severity = "high" if low_quality_count > len(quality_metrics) * 0.3 else "medium"
                recommendations.append({
                    "type": "data_quality_improvement",
                    "severity": severity,
                    "priority": "high",
                    "description": f"{low_quality_count}件の低品質データが検出されました",
                    "actions": [
                        "データソースの見直し",
                        "取得プロセスの改善",
                        "検証ルールの強化"
                    ],
                    "impact": "品質向上とエラー削減",
                    "confidence": 0.9
                })

            # 完全性改善
            completeness_scores = [m.completeness for m in quality_metrics]
            avg_completeness = np.mean(completeness_scores)
            if avg_completeness < 0.8:
                recommendations.append({
                    "type": "completeness_improvement",
                    "severity": "medium",
                    "priority": "medium",
                    "description": f"データ完全性が{avg_completeness:.1%}と低いです",
                    "actions": [
                        "必須フィールドの追加取得",
                        "オプショナルデータの充実",
                        "データソース拡張の検討"
                    ],
                    "impact": "データ価値向上",
                    "confidence": 0.8
                })

            # 異常検知結果に基づく推奨
            anomaly_scores = [m.anomaly_score for m in quality_metrics]
            high_anomaly_count = sum(1 for score in anomaly_scores if score > 0.7)
            if high_anomaly_count > 0:
                recommendations.append({
                    "type": "anomaly_investigation",
                    "severity": "high",
                    "priority": "high",
                    "description": f"{high_anomaly_count}件の異常データが検出されました",
                    "actions": [
                        "異常データの詳細調査",
                        "フィルタリングルールの追加",
                        "データ取得プロセスの見直し"
                    ],
                    "impact": "データ信頼性向上",
                    "confidence": 0.85
                })

            # パフォーマンス推奨
            if self.processing_history:
                perf_recommendations = self._generate_performance_recommendations()
                recommendations.extend(perf_recommendations)

            return recommendations

        except Exception as e:
            self.logger.error(f"推奨事項生成エラー: {e}")
            return []

    def get_comprehensive_status(self) -> Dict[str, Any]:
        """包括的ステータス取得"""
        try:
            status = {
                "engine_info": {
                    "version": "v2.0_advanced",
                    "sklearn_available": SKLEARN_AVAILABLE,
                    "models_loaded": self.models_loaded,
                    "last_updated": datetime.now().isoformat()
                },
                "model_status": {
                    "quality_classifier": self.quality_classifier is not None,
                    "anomaly_detector": self.anomaly_detector is not None,
                    "processing_time_predictor": self.processing_time_predictor is not None,
                    "scaler": self.scaler is not None
                },
                "configuration": {
                    "default_quality_score": self.default_quality_score,
                    "anomaly_threshold": self.anomaly_threshold,
                    "model_directory": str(self.model_dir)
                },
                "statistics": {
                    "quality_history_count": len(self.quality_history),
                    "processing_history_count": len(self.processing_history)
                }
            }

            # パフォーマンス統計
            if self.quality_history:
                recent_quality = self.quality_history[-100:]
                status["recent_performance"] = {
                    "average_quality_score": np.mean([m.overall_score for m in recent_quality]),
                    "average_confidence": np.mean([m.confidence for m in recent_quality]),
                    "anomaly_rate": np.mean([m.anomaly_score > self.anomaly_threshold for m in recent_quality])
                }

            return status

        except Exception as e:
            self.logger.error(f"ステータス取得エラー: {e}")
            return {"error": str(e)}

    def update_model_with_feedback(
        self,
        feedback_data: List[Dict[str, Any]]
    ) -> bool:
        """フィードバックデータでモデル更新"""
        try:
            if not SKLEARN_AVAILABLE or not feedback_data:
                return False

            # フィードバックデータの処理
            features = []
            labels = []

            for feedback in feedback_data:
                if 'features' in feedback and 'quality_label' in feedback:
                    features.append(feedback['features'])
                    labels.append(feedback['quality_label'])

            if len(features) < 5:  # 最小データ数
                self.logger.warning("フィードバックデータが不十分です")
                return False

            X = np.array(features)
            y = np.array(labels)

            # 品質分類器の部分更新
            if self.quality_classifier is not None and self.scaler is not None:
                X_scaled = self.scaler.transform(X)

                # 既存モデルと新データでの追加学習
                self.quality_classifier.fit(X_scaled, y)

                # モデル保存
                self._save_models()

                self.logger.info(f"モデル更新完了: {len(features)}件のフィードバック")
                return True

            return False

        except Exception as e:
            self.logger.error(f"モデル更新エラー: {e}")
            return False

    # ヘルパーメソッド（新規・改良版）
    def _calculate_prediction_confidence(self, features: np.ndarray) -> float:
        """予測信頼度計算"""
        try:
            if len(self.processing_history) < 10:
                return 0.6  # データ不足時の基本信頼度

            # 履歴データとの類似性ベース
            historical_features = []
            for job in self.processing_history[-50:]:  # 最新50件
                if job.get('data_count') and job.get('duration'):
                    hist_features = [
                        job.get('data_count', 0),
                        job.get('complexity', 0.5),
                        job.get('worker_count', 1)
                    ]
                    historical_features.append(hist_features)

            if historical_features:
                hist_array = np.array(historical_features)

                # 特徴量空間での距離計算
                distances = np.linalg.norm(hist_array - features, axis=1)
                min_distance = np.min(distances)

                # 距離が近いほど高信頼度
                confidence = max(0.3, min(1.0, 1.0 - (min_distance / np.max(distances))))
                return confidence

            return 0.5

        except Exception:
            return 0.5

    def _get_historical_adjustment(self) -> float:
        """履歴ベース調整係数取得"""
        try:
            if len(self.processing_history) < 5:
                return 1.0

            recent_jobs = [
                job for job in self.processing_history[-20:]
                if job.get('status') == 'success' and job.get('duration')
            ]

            if recent_jobs:
                durations = [job['duration'] for job in recent_jobs]
                data_counts = [job.get('data_count', 0) for job in recent_jobs]

                if data_counts and all(count > 0 for count in data_counts):
                    actual_rates = [d / c for d, c in zip(durations, data_counts)]
                    avg_rate = np.mean(actual_rates)

                    # 理論値との比較（理論値: 1.2秒/item）
                    adjustment = avg_rate / 1.2
                    return max(0.5, min(2.0, adjustment))  # 0.5〜2.0倍の範囲

            return 1.0

        except Exception:
            return 1.0

    def _calculate_batch_efficiency(
        self,
        batch_size: int,
        num_batches: int,
        workers: int
    ) -> float:
        """バッチ効率性計算"""
        try:
            # 並列効率性
            parallel_efficiency = min(1.0, workers / max(1, num_batches))

            # サイズ効率性（中程度のサイズが最適）
            size_efficiency = 1.0 - abs(batch_size - 50) / 100
            size_efficiency = max(0.2, min(1.0, size_efficiency))

            # 総合効率性
            overall_efficiency = (parallel_efficiency + size_efficiency) / 2

            return overall_efficiency

        except Exception:
            return 0.5

    def _generate_batch_size_reasoning(
        self,
        batch_size: int,
        workers: int,
        total_queries: int
    ) -> str:
        """バッチサイズ推論理由生成"""
        try:
            reasons = []

            # ワーカー数ベース
            if workers >= 8:
                reasons.append("高並列環境に最適化（小さめバッチ）")
            elif workers <= 2:
                reasons.append("低並列環境に最適化（大きめバッチ）")
            else:
                reasons.append("中程度並列環境に最適化")

            # データ量ベース
            if total_queries < 100:
                reasons.append("小規模データセット対応")
            elif total_queries > 1000:
                reasons.append("大規模データセット効率化")

            # 履歴ベース
            if self.processing_history:
                reasons.append("過去の成功パターンを反映")

            return " | ".join(reasons)

        except Exception:
            return "基本的な最適化ロジック適用"

    def _generate_performance_recommendations(self) -> List[Dict[str, Any]]:
        """パフォーマンス推奨事項生成"""
        recommendations = []

        try:
            if len(self.processing_history) < 5:
                return recommendations

            recent_jobs = self.processing_history[-20:]

            # 処理時間分析
            durations = [job.get('duration', 0) for job in recent_jobs if job.get('duration')]
            if durations:
                avg_duration = np.mean(durations)
                if avg_duration > 600:  # 10分以上
                    recommendations.append({
                        "type": "performance_optimization",
                        "severity": "medium",
                        "priority": "medium",
                        "description": f"平均処理時間が{avg_duration/60:.1f}分と長いです",
                        "actions": [
                            "バッチサイズの最適化",
                            "並列処理の強化",
                            "ボトルネック分析の実施"
                        ],
                        "impact": "処理速度向上",
                        "confidence": 0.8
                    })

            # エラー率分析
            error_rate = sum(1 for job in recent_jobs if job.get('status') == 'failed') / len(recent_jobs)
            if error_rate > 0.1:  # 10%以上
                recommendations.append({
                    "type": "reliability_improvement",
                    "severity": "high",
                    "priority": "high",
                    "description": f"エラー率が{error_rate:.1%}と高いです",
                    "actions": [
                        "エラーハンドリングの強化",
                        "リトライ機構の改善",
                        "根本原因の分析"
                    ],
                    "impact": "安定性向上",
                    "confidence": 0.9
                })

            return recommendations

        except Exception as e:
            self.logger.debug(f"パフォーマンス推奨生成エラー: {e}")
            return []

    def analyze_processing_patterns(
        self,
        processing_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """高度な処理パターン分析"""
        try:
            if not processing_history:
                return {"status": "no_data", "patterns": {}, "recommendations": []}

            # 基本統計分析
            basic_stats = self._calculate_basic_statistics(processing_history)

            # 時間パターン分析
            temporal_patterns = self._analyze_temporal_patterns(processing_history)

            # 性能パターン分析
            performance_patterns = self._analyze_performance_patterns(processing_history)

            # エラーパターン分析
            error_patterns = self._analyze_error_patterns_advanced(processing_history)

            # 効率性分析
            efficiency_patterns = self._analyze_efficiency_patterns(processing_history)

            # 予測分析
            predictions = self._generate_pattern_predictions(processing_history)

            # 最適化推奨事項
            recommendations = self._generate_optimization_recommendations(
                basic_stats, temporal_patterns, performance_patterns, error_patterns
            )

            patterns = {
                "basic_statistics": basic_stats,
                "temporal_patterns": temporal_patterns,
                "performance_patterns": performance_patterns,
                "error_patterns": error_patterns,
                "efficiency_patterns": efficiency_patterns,
                "predictions": predictions,
                "analysis_timestamp": datetime.now().isoformat()
            }

            return {
                "status": "success",
                "patterns": patterns,
                "recommendations": recommendations,
                "confidence": self._calculate_analysis_confidence(processing_history)
            }

        except Exception as e:
            self.logger.error(f"処理パターン分析エラー: {e}")
            return {"status": "error", "error": str(e)}

    def _calculate_basic_statistics(self, history: List[Dict]) -> Dict[str, Any]:
        """基本統計計算"""
        try:
            total_jobs = len(history)
            success_jobs = [job for job in history if job.get('status') == 'success']
            failed_jobs = [job for job in history if job.get('status') == 'failed']

            success_rate = len(success_jobs) / total_jobs if total_jobs > 0 else 0

            # 処理時間統計
            durations = [job.get('duration', 0) for job in success_jobs if job.get('duration')]
            avg_duration = np.mean(durations) if durations else 0
            std_duration = np.std(durations) if durations else 0

            # データ量統計
            data_counts = [job.get('data_count', 0) for job in success_jobs if job.get('data_count')]
            avg_data_count = np.mean(data_counts) if data_counts else 0

            # スループット計算
            total_processed = sum(data_counts)
            total_time = sum(durations) if durations else 1
            throughput = total_processed / total_time if total_time > 0 else 0

            return {
                "total_jobs": total_jobs,
                "success_jobs": len(success_jobs),
                "failed_jobs": len(failed_jobs),
                "success_rate": success_rate,
                "average_duration": avg_duration,
                "std_duration": std_duration,
                "average_data_count": avg_data_count,
                "total_processed": total_processed,
                "throughput_items_per_second": throughput
            }

        except Exception as e:
            self.logger.debug(f"基本統計計算エラー: {e}")
            return {}

    def _analyze_temporal_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """時間パターン分析"""
        try:
            hourly_stats = {}
            daily_stats = {}
            weekly_stats = {}

            for job in history:
                timestamp = job.get('timestamp')
                if not timestamp:
                    continue

                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    hour = dt.hour
                    day = dt.strftime('%Y-%m-%d')
                    weekday = dt.weekday()

                    # 時間別統計
                    if hour not in hourly_stats:
                        hourly_stats[hour] = {'count': 0, 'success': 0, 'total_duration': 0}
                    hourly_stats[hour]['count'] += 1
                    if job.get('status') == 'success':
                        hourly_stats[hour]['success'] += 1
                        hourly_stats[hour]['total_duration'] += job.get('duration', 0)

                    # 日別統計
                    if day not in daily_stats:
                        daily_stats[day] = {'count': 0, 'success': 0}
                    daily_stats[day]['count'] += 1
                    if job.get('status') == 'success':
                        daily_stats[day]['success'] += 1

                    # 曜日別統計
                    if weekday not in weekly_stats:
                        weekly_stats[weekday] = {'count': 0, 'success': 0}
                    weekly_stats[weekday]['count'] += 1
                    if job.get('status') == 'success':
                        weekly_stats[weekday]['success'] += 1

                except Exception:
                    continue

            # ピーク時間帯特定
            peak_hours = sorted(
                hourly_stats.items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )[:3]

            # 最高性能時間帯
            best_performance_hours = []
            for hour, stats in hourly_stats.items():
                if stats['count'] > 0:
                    success_rate = stats['success'] / stats['count']
                    avg_duration = stats['total_duration'] / stats['success'] if stats['success'] > 0 else float('inf')
                    best_performance_hours.append((hour, success_rate, avg_duration))

            best_performance_hours.sort(key=lambda x: (-x[1], x[2]))  # 成功率高、処理時間短

            return {
                "hourly_distribution": hourly_stats,
                "daily_distribution": daily_stats,
                "weekly_distribution": weekly_stats,
                "peak_hours": [h[0] for h in peak_hours],
                "best_performance_hours": [h[0] for h in best_performance_hours[:3]],
                "temporal_trends": self._detect_temporal_trends(daily_stats)
            }

        except Exception as e:
            self.logger.debug(f"時間パターン分析エラー: {e}")
            return {}

    def _analyze_performance_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """性能パターン分析"""
        try:
            performance_data = []

            for job in history:
                if job.get('status') == 'success' and job.get('duration'):
                    performance_data.append({
                        'duration': job['duration'],
                        'data_count': job.get('data_count', 0),
                        'worker_count': job.get('worker_count', 1),
                        'timestamp': job.get('timestamp')
                    })

            if not performance_data:
                return {}

            # 処理速度分析
            durations = [p['duration'] for p in performance_data]
            data_counts = [p['data_count'] for p in performance_data]

            # スケーラビリティ分析
            worker_performance = {}
            for p in performance_data:
                workers = p['worker_count']
                if workers not in worker_performance:
                    worker_performance[workers] = []
                if p['data_count'] > 0:
                    efficiency = p['data_count'] / p['duration']  # アイテム/秒
                    worker_performance[workers].append(efficiency)

            # 平均効率計算
            avg_efficiency_by_workers = {}
            for workers, efficiencies in worker_performance.items():
                avg_efficiency_by_workers[workers] = np.mean(efficiencies)

            # 最適ワーカー数推定
            optimal_workers = max(avg_efficiency_by_workers.items(), key=lambda x: x[1])[0] if avg_efficiency_by_workers else 1

            # パフォーマンス異常検知
            duration_mean = np.mean(durations)
            duration_std = np.std(durations)

            slow_jobs = [
                p for p in performance_data
                if p['duration'] > duration_mean + 2 * duration_std
            ]

            return {
                "average_duration": duration_mean,
                "duration_std": duration_std,
                "average_throughput": np.mean([d/t for d, t in zip(data_counts, durations) if t > 0]),
                "worker_efficiency": avg_efficiency_by_workers,
                "optimal_worker_count": optimal_workers,
                "slow_job_count": len(slow_jobs),
                "performance_variance": np.var(durations),
                "scalability_factor": self._calculate_scalability_factor(worker_performance)
            }

        except Exception as e:
            self.logger.debug(f"性能パターン分析エラー: {e}")
            return {}

    def _analyze_error_patterns_advanced(self, history: List[Dict]) -> Dict[str, Any]:
        """高度なエラーパターン分析"""
        try:
            error_jobs = [job for job in history if job.get('status') == 'failed']

            if not error_jobs:
                return {"error_count": 0, "error_types": {}, "error_trends": []}

            # エラータイプ分類
            error_types = {}
            error_timeline = []

            for job in error_jobs:
                error_msg = job.get('error', 'Unknown error')
                timestamp = job.get('timestamp')

                # エラータイプの分類
                error_type = self._classify_error_type(error_msg)
                error_types[error_type] = error_types.get(error_type, 0) + 1

                # タイムライン記録
                if timestamp:
                    error_timeline.append({
                        'timestamp': timestamp,
                        'error_type': error_type,
                        'error_msg': error_msg
                    })

            # エラー頻度分析
            error_frequency = self._analyze_error_frequency(error_timeline)

            # 相関分析
            error_correlations = self._analyze_error_correlations(history)

            return {
                "error_count": len(error_jobs),
                "error_types": error_types,
                "error_frequency": error_frequency,
                "error_correlations": error_correlations,
                "most_common_error": max(error_types.items(), key=lambda x: x[1])[0] if error_types else None,
                "error_rate_trend": self._calculate_error_rate_trend(history)
            }

        except Exception as e:
            self.logger.debug(f"エラーパターン分析エラー: {e}")
            return {}

    def _analyze_efficiency_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """効率性パターン分析"""
        try:
            efficiency_data = []

            for job in history:
                if job.get('status') == 'success':
                    duration = job.get('duration', 0)
                    data_count = job.get('data_count', 0)
                    worker_count = job.get('worker_count', 1)

                    if duration > 0 and data_count > 0:
                        # 効率性指標
                        throughput = data_count / duration
                        worker_efficiency = throughput / worker_count

                        efficiency_data.append({
                            'throughput': throughput,
                            'worker_efficiency': worker_efficiency,
                            'resource_utilization': data_count / (duration * worker_count),
                            'timestamp': job.get('timestamp')
                        })

            if not efficiency_data:
                return {}

            # 効率性トレンド
            throughputs = [e['throughput'] for e in efficiency_data]
            worker_efficiencies = [e['worker_efficiency'] for e in efficiency_data]

            # 効率性統計
            efficiency_stats = {
                "average_throughput": np.mean(throughputs),
                "max_throughput": np.max(throughputs),
                "min_throughput": np.min(throughputs),
                "throughput_std": np.std(throughputs),
                "average_worker_efficiency": np.mean(worker_efficiencies),
                "efficiency_trend": self._calculate_efficiency_trend(efficiency_data)
            }

            # 効率性改善ポテンシャル
            improvement_potential = self._calculate_improvement_potential(efficiency_data)

            return {**efficiency_stats, "improvement_potential": improvement_potential}

        except Exception as e:
            self.logger.debug(f"効率性分析エラー: {e}")
            return {}

    def _generate_pattern_predictions(self, history: List[Dict]) -> Dict[str, Any]:
        """パターン予測生成"""
        try:
            if len(history) < 10:
                return {"status": "insufficient_data"}

            # 処理時間予測
            recent_jobs = history[-20:]  # 最新20件
            success_jobs = [j for j in recent_jobs if j.get('status') == 'success']

            if success_jobs:
                recent_durations = [j['duration'] for j in success_jobs if j.get('duration')]
                if recent_durations:
                    predicted_duration = np.mean(recent_durations)
                    duration_confidence = 1.0 / (1.0 + np.std(recent_durations))
                else:
                    predicted_duration = 0
                    duration_confidence = 0
            else:
                predicted_duration = 0
                duration_confidence = 0

            # 成功率予測
            recent_success_rate = len(success_jobs) / len(recent_jobs)

            # リソース需要予測
            if success_jobs:
                avg_data_count = np.mean([j.get('data_count', 0) for j in success_jobs])
                predicted_resources = self._predict_resource_needs_advanced(
                    avg_data_count, predicted_duration, recent_success_rate
                )
            else:
                predicted_resources = {}

            return {
                "status": "success",
                "predicted_duration": predicted_duration,
                "duration_confidence": duration_confidence,
                "predicted_success_rate": recent_success_rate,
                "predicted_resources": predicted_resources,
                "prediction_timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.debug(f"予測生成エラー: {e}")
            return {"status": "error", "error": str(e)}

    def _generate_optimization_recommendations(
        self,
        basic_stats: Dict,
        temporal_patterns: Dict,
        performance_patterns: Dict,
        error_patterns: Dict
    ) -> List[Dict[str, Any]]:
        """最適化推奨事項生成"""
        recommendations = []

        try:
            # 成功率改善
            success_rate = basic_stats.get('success_rate', 1.0)
            if success_rate < 0.9:
                recommendations.append({
                    "type": "success_rate_improvement",
                    "priority": "high",
                    "description": f"成功率が{success_rate:.1%}と低いです",
                    "suggestions": [
                        "エラーパターンの詳細分析",
                        "リトライ機構の改善",
                        "入力データの前処理強化"
                    ],
                    "impact": "high"
                })

            # パフォーマンス最適化
            optimal_workers = performance_patterns.get('optimal_worker_count', 1)
            if optimal_workers != 1:
                recommendations.append({
                    "type": "worker_optimization",
                    "priority": "medium",
                    "description": f"最適ワーカー数は{optimal_workers}です",
                    "suggestions": [
                        f"ワーカー数を{optimal_workers}に設定",
                        "負荷分散の最適化",
                        "並列処理効率の向上"
                    ],
                    "impact": "medium"
                })

            # 時間最適化
            best_hours = temporal_patterns.get('best_performance_hours', [])
            if best_hours:
                recommendations.append({
                    "type": "timing_optimization",
                    "priority": "low",
                    "description": f"最適実行時間帯: {best_hours[:3]}時",
                    "suggestions": [
                        "スケジュール調整の検討",
                        "ピーク時間回避",
                        "リソース競合の軽減"
                    ],
                    "impact": "low"
                })

            # エラー対策
            most_common_error = error_patterns.get('most_common_error')
            if most_common_error:
                recommendations.append({
                    "type": "error_reduction",
                    "priority": "high",
                    "description": f"最頻出エラー: {most_common_error}",
                    "suggestions": [
                        "特定エラーの根本原因分析",
                        "対応するエラーハンドリング強化",
                        "予防的対策の実装"
                    ],
                    "impact": "high"
                })

            return recommendations

        except Exception as e:
            self.logger.debug(f"推奨事項生成エラー: {e}")
            return []

    # ヘルパーメソッド
    def _detect_temporal_trends(self, daily_stats: Dict) -> List[str]:
        """時間的トレンド検出"""
        trends = []

        try:
            dates = sorted(daily_stats.keys())
            if len(dates) >= 7:
                # 最近7日の成功率トレンド
                recent_rates = []
                for date in dates[-7:]:
                    stats = daily_stats[date]
                    rate = stats['success'] / stats['count'] if stats['count'] > 0 else 0
                    recent_rates.append(rate)

                # トレンド判定
                if len(recent_rates) > 1:
                    slope = np.polyfit(range(len(recent_rates)), recent_rates, 1)[0]
                    if slope > 0.01:
                        trends.append("success_rate_improving")
                    elif slope < -0.01:
                        trends.append("success_rate_declining")
                    else:
                        trends.append("success_rate_stable")

            return trends

        except Exception:
            return []

    def _calculate_scalability_factor(self, worker_performance: Dict) -> float:
        """スケーラビリティ係数計算"""
        try:
            if len(worker_performance) < 2:
                return 1.0

            workers = sorted(worker_performance.keys())
            efficiencies = [np.mean(worker_performance[w]) for w in workers]

            # 理想的なスケーリング（線形）との比較
            ideal_efficiency = efficiencies[0]  # 1ワーカーの効率
            actual_scaling = []
            ideal_scaling = []

            for i, w in enumerate(workers):
                actual_scaling.append(efficiencies[i] * w)
                ideal_scaling.append(ideal_efficiency * w)

            # 相関係数計算
            if len(actual_scaling) > 1:
                correlation = np.corrcoef(actual_scaling, ideal_scaling)[0, 1]
                return max(0.0, correlation)

            return 1.0

        except Exception:
            return 1.0

    def _classify_error_type(self, error_msg: str) -> str:
        """エラータイプ分類"""
        error_msg_lower = error_msg.lower()

        if 'timeout' in error_msg_lower or 'time out' in error_msg_lower:
            return 'timeout'
        elif 'connection' in error_msg_lower or 'network' in error_msg_lower:
            return 'network'
        elif 'api' in error_msg_lower and ('limit' in error_msg_lower or 'quota' in error_msg_lower):
            return 'api_limit'
        elif 'permission' in error_msg_lower or 'auth' in error_msg_lower:
            return 'authentication'
        elif 'data' in error_msg_lower or 'format' in error_msg_lower:
            return 'data_format'
        elif 'memory' in error_msg_lower or 'resource' in error_msg_lower:
            return 'resource'
        else:
            return 'other'

    def _analyze_error_frequency(self, error_timeline: List[Dict]) -> Dict[str, Any]:
        """エラー頻度分析"""
        try:
            if not error_timeline:
                return {}

            # 時間別エラー頻度
            hourly_errors = {}
            for error in error_timeline:
                try:
                    dt = datetime.fromisoformat(error['timestamp'].replace('Z', '+00:00'))
                    hour = dt.hour
                    hourly_errors[hour] = hourly_errors.get(hour, 0) + 1
                except:
                    continue

            return {
                "hourly_distribution": hourly_errors,
                "peak_error_hour": max(hourly_errors.items(), key=lambda x: x[1])[0] if hourly_errors else None,
                "total_errors": len(error_timeline)
            }

        except Exception:
            return {}

    def _analyze_error_correlations(self, history: List[Dict]) -> Dict[str, Any]:
        """エラー相関分析"""
        try:
            correlations = {}

            # ワーカー数とエラー率の相関
            worker_error_rates = {}
            for job in history:
                worker_count = job.get('worker_count', 1)
                is_error = job.get('status') == 'failed'

                if worker_count not in worker_error_rates:
                    worker_error_rates[worker_count] = {'total': 0, 'errors': 0}

                worker_error_rates[worker_count]['total'] += 1
                if is_error:
                    worker_error_rates[worker_count]['errors'] += 1

            # エラー率計算
            worker_rates = {}
            for workers, stats in worker_error_rates.items():
                if stats['total'] > 0:
                    worker_rates[workers] = stats['errors'] / stats['total']

            correlations['worker_error_correlation'] = worker_rates

            return correlations

        except Exception:
            return {}

    def _calculate_error_rate_trend(self, history: List[Dict]) -> str:
        """エラー率トレンド計算"""
        try:
            if len(history) < 10:
                return "insufficient_data"

            # 最新と過去の比較
            recent = history[-10:]
            older = history[-20:-10] if len(history) >= 20 else []

            recent_error_rate = sum(1 for j in recent if j.get('status') == 'failed') / len(recent)

            if older:
                older_error_rate = sum(1 for j in older if j.get('status') == 'failed') / len(older)

                if recent_error_rate > older_error_rate * 1.2:
                    return "increasing"
                elif recent_error_rate < older_error_rate * 0.8:
                    return "decreasing"
                else:
                    return "stable"

            return "insufficient_history"

        except Exception:
            return "error"

    def _calculate_efficiency_trend(self, efficiency_data: List[Dict]) -> str:
        """効率性トレンド計算"""
        try:
            if len(efficiency_data) < 5:
                return "insufficient_data"

            throughputs = [e['throughput'] for e in efficiency_data[-10:]]

            # 線形回帰でトレンド計算
            x = list(range(len(throughputs)))
            slope = np.polyfit(x, throughputs, 1)[0]

            if slope > 0.1:
                return "improving"
            elif slope < -0.1:
                return "declining"
            else:
                return "stable"

        except Exception:
            return "error"

    def _calculate_improvement_potential(self, efficiency_data: List[Dict]) -> Dict[str, Any]:
        """改善ポテンシャル計算"""
        try:
            if not efficiency_data:
                return {}

            throughputs = [e['throughput'] for e in efficiency_data]
            max_throughput = np.max(throughputs)
            avg_throughput = np.mean(throughputs)

            improvement_ratio = (max_throughput - avg_throughput) / avg_throughput if avg_throughput > 0 else 0

            return {
                "max_observed_throughput": max_throughput,
                "average_throughput": avg_throughput,
                "improvement_potential_ratio": improvement_ratio,
                "potential_rating": "high" if improvement_ratio > 0.5 else "medium" if improvement_ratio > 0.2 else "low"
            }

        except Exception:
            return {}

    def _predict_resource_needs_advanced(
        self,
        data_count: float,
        duration: float,
        success_rate: float
    ) -> Dict[str, Any]:
        """高度なリソース需要予測"""
        try:
            # 基本リソース計算
            base_memory = data_count * 0.1  # MB per item
            base_cpu_time = duration

            # 成功率を考慮したバッファ
            failure_buffer = 1.0 / max(0.1, success_rate)

            # 予測値計算
            predicted_memory = base_memory * failure_buffer
            predicted_cpu_time = base_cpu_time * failure_buffer

            # ワーカー数推奨
            recommended_workers = max(1, int(predicted_cpu_time / 300))  # 5分以内に完了

            return {
                "predicted_memory_mb": predicted_memory,
                "predicted_cpu_time_seconds": predicted_cpu_time,
                "recommended_workers": recommended_workers,
                "confidence": min(1.0, success_rate)
            }

        except Exception:
            return {}

    def _calculate_analysis_confidence(self, history: List[Dict]) -> float:
        """分析信頼度計算"""
        try:
            # データ量による信頼度
            data_confidence = min(1.0, len(history) / 100)

            # 成功率による信頼度
            success_jobs = [j for j in history if j.get('status') == 'success']
            success_confidence = len(success_jobs) / len(history) if history else 0

            # 時間的カバレッジによる信頼度
            timestamps = [j.get('timestamp') for j in history if j.get('timestamp')]
            if len(timestamps) >= 2:
                try:
                    first_time = datetime.fromisoformat(timestamps[0].replace('Z', '+00:00'))
                    last_time = datetime.fromisoformat(timestamps[-1].replace('Z', '+00:00'))
                    time_span_hours = (last_time - first_time).total_seconds() / 3600
                    time_confidence = min(1.0, time_span_hours / 168)  # 1週間でフル信頼度
                except:
                    time_confidence = 0.5
            else:
                time_confidence = 0.5

            # 総合信頼度
            overall_confidence = (data_confidence + success_confidence + time_confidence) / 3

            return overall_confidence

        except Exception:
            return 0.5

    def predict_resource_needs(
        self,
        upcoming_workload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """リソース需要予測（プレースホルダー）"""

        try:
            query_count = upcoming_workload.get('query_count', 0)
            complexity = upcoming_workload.get('complexity', 0.5)
            deadline = upcoming_workload.get('deadline_hours', 24)

            # 基本的なリソース計算
            estimated_time = self.predict_processing_time(query_count, complexity)
            required_workers = max(1, int(estimated_time / (deadline * 3600)) + 1)
            memory_estimate = query_count * 0.1  # MB per query

            recommendations = {
                "required_workers": required_workers,
                "estimated_memory_mb": memory_estimate,
                "estimated_duration_hours": estimated_time / 3600,
                "recommended_batch_size": self.optimize_batch_size(query_count, required_workers),
                "priority_level": "high" if deadline < 6 else "normal"
            }

            return {"status": "success", "recommendations": recommendations}

        except Exception as e:
            self.logger.error(f"リソース需要予測エラー: {e}")
            return {"status": "error", "error": str(e)}

    # 内部ヘルパーメソッド（従来の基本実装も保持）
    def _calculate_basic_quality_score(self, item: Dict) -> float:
        """基本的な品質スコア計算（後方互換性）"""
        score = 0.0
        max_score = 1.0

        # 必須フィールドの存在確認
        required_fields = ['place_id', 'name']
        field_score = sum(1 for field in required_fields if item.get(field)) / len(required_fields)
        score += field_score * 0.4

        # オプショナルフィールドの充実度
        optional_fields = ['formatted_address', 'rating', 'phone_number', 'website']
        optional_score = sum(1 for field in optional_fields if item.get(field)) / len(optional_fields)
        score += optional_score * 0.3

        # データの妥当性
        validity_score = 0.3  # ベーススコア
        if item.get('rating'):
            try:
                rating = float(item['rating'])
                if 1.0 <= rating <= 5.0:
                    validity_score += 0.1
            except (ValueError, TypeError):
                pass

        score += validity_score

        return min(score, max_score)

    def _detect_basic_anomaly(self, item: Dict) -> bool:
        """基本的な異常検知（後方互換性）"""
        # 明らかに異常なケース
        if not item.get('place_id') or not item.get('name'):
            return True

        # 評価値の異常
        if item.get('rating'):
            try:
                rating = float(item['rating'])
                if rating < 1.0 or rating > 5.0:
                    return True
            except (ValueError, TypeError):
                return True

        # 名前が異常に短い/長い
        name = item.get('name', '')
        if len(name) < 2 or len(name) > 200:
            return True

        return False

    def _generate_basic_recommendation(self, score: float) -> str:
        """基本的な推奨事項生成（後方互換性）"""
        if score < 0.3:
            return "データの再取得を推奨"
        elif score < 0.6:
            return "追加検証が必要"
        elif score < 0.8:
            return "軽微な修正が必要"
        else:
            return "品質良好"

    def _analyze_peak_hours(self, processing_history: List[Dict]) -> List[int]:
        """ピーク時間帯分析（後方互換性）"""
        hour_counts = {}

        for job in processing_history:
            timestamp = job.get('timestamp')
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    hour = dt.hour
                    hour_counts[hour] = hour_counts.get(hour, 0) + 1
                except:
                    continue

        # 上位3時間帯を返す
        sorted_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)
        return [hour for hour, count in sorted_hours[:3]]

    def _analyze_error_patterns(self, processing_history: List[Dict]) -> Dict[str, int]:
        """エラーパターン分析（後方互換性）"""
        error_types = {}

        for job in processing_history:
            if job.get('status') == 'failed':
                error = job.get('error', 'Unknown error')
                error_type = error.split(':')[0] if ':' in error else error
                error_types[error_type] = error_types.get(error_type, 0) + 1

        return error_types

    def get_model_status(self) -> Dict[str, Any]:
        """モデル状態取得"""
        return {
            "models_loaded": self.models_loaded,
            "default_quality_score": self.default_quality_score,
            "anomaly_threshold": self.anomaly_threshold,
            "version": "placeholder_v1.0",
            "last_updated": datetime.now().isoformat()
        }

    def update_model_parameters(self, parameters: Dict[str, Any]) -> bool:
        """モデルパラメータ更新"""
        try:
            if 'default_quality_score' in parameters:
                self.default_quality_score = float(parameters['default_quality_score'])

            if 'anomaly_threshold' in parameters:
                self.anomaly_threshold = float(parameters['anomaly_threshold'])

            self.logger.info(f"モデルパラメータ更新: {parameters}")
            return True

        except Exception as e:
            self.logger.error(f"パラメータ更新エラー: {e}")
            return False


# ファクトリー関数（拡張版）
def create_ml_engine(model_dir: str = "models", config: Dict[str, Any] = None) -> MLEngine:
    """MLEngine インスタンス作成（設定可能版）"""
    engine = MLEngine(model_dir)

    if config:
        engine.update_model_parameters(config)

    return engine


# 包括的テスト関数
def test_ml_engine_comprehensive():
    """MLEngine 包括テスト"""
    print("🔬 ML Engine 包括テスト開始...")

    # エンジン作成
    engine = create_ml_engine()

    # テストデータ準備
    test_data = [
        {
            "place_id": "ChIJ123test",
            "name": "佐渡の美味しい寿司屋",
            "formatted_address": "新潟県佐渡市両津",
            "rating": 4.5,
            "user_ratings_total": 120,
            "phone_number": "0259-12-3456",
            "website": "https://example.com"
        },
        {
            "place_id": "ChIJ456test",
            "name": "相川ラーメン店",
            "formatted_address": "新潟県佐渡市相川",
            "rating": 3.8,
            "user_ratings_total": 45
        },
        {
            "place_id": "",  # 異常データ
            "name": "不正店舗",
            "rating": 6.0  # 無効な評価値
        },
        {
            "place_id": "ChIJ789test",
            "name": "テスト店舗東京",  # 地理的に不正
            "formatted_address": "東京都渋谷区",
            "rating": 4.0
        }
    ]

    print(f"📊 テストデータ: {len(test_data)}件")

    # 1. データ品質分析テスト
    print("\n1️⃣ データ品質分析テスト")
    quality_metrics = engine.analyze_data_quality(test_data)

    for i, metrics in enumerate(quality_metrics):
        print(f"  データ{i+1}: 総合スコア={metrics.overall_score:.3f}, "
              f"完全性={metrics.completeness:.3f}, "
              f"異常スコア={metrics.anomaly_score:.3f}")

    # 2. 異常検知テスト
    print("\n2️⃣ 異常検知テスト")
    anomaly_reports = engine.detect_anomalies(test_data)

    for i, report in enumerate(anomaly_reports):
        status = "🚨異常" if report.is_anomaly else "✅正常"
        print(f"  データ{i+1}: {status} - {report.explanation}")

    # 3. 推奨事項テスト
    print("\n3️⃣ 推奨事項生成テスト")
    recommendations = engine.generate_recommendations(quality_metrics)

    for rec in recommendations:
        print(f"  📋 {rec['type']}: {rec['description']}")

    # 4. 処理時間予測テスト
    print("\n4️⃣ 処理時間予測テスト")
    time_prediction = engine.predict_processing_time(100, 0.5, 4)
    print(f"  ⏱️ 予測時間: {time_prediction.prediction:.1f}秒 "
          f"(信頼度: {time_prediction.confidence:.2f})")

    # 5. バッチサイズ最適化テスト
    print("\n5️⃣ バッチサイズ最適化テスト")
    batch_optimization = engine.optimize_batch_size(1000, 4, 300)
    print(f"  📦 最適バッチサイズ: {batch_optimization['optimal_batch_size']}")
    print(f"  📈 効率スコア: {batch_optimization['efficiency_score']:.2f}")

    # 6. 処理パターン分析テスト（サンプルデータ）
    print("\n6️⃣ 処理パターン分析テスト")
    sample_history = [
        {
            "timestamp": (datetime.now() - timedelta(hours=i)).isoformat(),
            "status": "success" if i % 4 != 0 else "failed",
            "duration": 120 + (i * 10),
            "data_count": 50 + (i * 5),
            "worker_count": 2 + (i % 3)
        }
        for i in range(20)
    ]

    pattern_analysis = engine.analyze_processing_patterns(sample_history)
    if pattern_analysis["status"] == "success":
        patterns = pattern_analysis["patterns"]
        print(f"  📊 成功率: {patterns['basic_statistics']['success_rate']:.1%}")
        print(f"  ⚡ 平均スループット: {patterns['basic_statistics']['throughput_items_per_second']:.2f} items/sec")

    # 7. リソース需要予測テスト
    print("\n7️⃣ リソース需要予測テスト")
    workload = {
        "query_count": 500,
        "complexity": 0.7,
        "deadline_hours": 2,
        "priority": "high"
    }

    resource_prediction = engine.predict_resource_needs(workload)
    if resource_prediction["status"] == "success":
        rec = resource_prediction["recommendations"]
        print(f"  🔧 推奨ワーカー数: {rec['required_workers']}")
        print(f"  💾 推定メモリ: {rec['estimated_memory_mb']:.0f}MB")
        print(f"  ⚠️ リスクレベル: {rec['risk_level']}")

    # 8. 総合ステータステスト
    print("\n8️⃣ 総合ステータステスト")
    status = engine.get_comprehensive_status()
    print(f"  🏷️ バージョン: {status['engine_info']['version']}")
    print(f"  🤖 scikit-learn利用可能: {status['engine_info']['sklearn_available']}")
    print(f"  📚 品質履歴件数: {status['statistics']['quality_history_count']}")

    print("\n✅ 包括テスト完了！")

    return engine


# 互換性のため、従来のテスト関数も保持
def test_ml_engine():
    """MLEngine テスト（基本版）"""
    engine = create_ml_engine()

    # テストデータ
    test_data = [
        {"place_id": "test1", "name": "テスト店舗1", "rating": 4.5},
        {"place_id": "test2", "name": "テスト店舗2", "rating": 3.8, "formatted_address": "住所"},
        {"place_id": "", "name": "不正データ"},  # 異常データ
    ]

    # 基本機能テスト（後方互換性）
    quality_scores = [engine._calculate_basic_quality_score(item) for item in test_data]
    print(f"品質スコア: {quality_scores}")

    anomalies = [engine._detect_basic_anomaly(item) for item in test_data]
    print(f"異常検知: {anomalies}")

    recommendations = [engine._generate_basic_recommendation(score) for score in quality_scores]
    print(f"推奨事項: {recommendations}")

    predicted_time = engine.predict_processing_time(100, 0.5, 4)
    print(f"処理時間予測: {predicted_time.prediction:.1f}秒")

    optimal_batch = engine.optimize_batch_size(1000, 4)
    print(f"最適バッチサイズ: {optimal_batch['optimal_batch_size']}")


if __name__ == "__main__":
    # 包括テスト実行
    test_ml_engine_comprehensive()

    print("\n" + "="*50)
    print("基本テストも実行...")
    test_ml_engine()
