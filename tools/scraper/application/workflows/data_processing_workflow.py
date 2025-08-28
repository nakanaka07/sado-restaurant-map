#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Data Processing Workflow

Integrated data processing workflow using new Clean Architecture.
"""

import time
from typing import List, Dict, Any, Optional
from pathlib import Path

from core.processors.data_processor import DataProcessor
from core.domain.interfaces import APIClient, DataStorage, DataValidator
from shared.types.core_types import ProcessingResult, CategoryType, QueryData
from shared.settings import ScraperConfig
from shared.logger import get_logger
from shared.exceptions import ValidationError, ConfigurationError


class DataProcessingWorkflow:
    """Data processing workflow controller for scraper operations"""

    def __init__(
        self,
        processor: DataProcessor,
        config: ScraperConfig,
        logger=None
    ):
        """Initialize workflow with dependencies"""
        self._processor = processor
        self._config = config
        self._logger = logger or get_logger(__name__)

        self.data_files = {
            'restaurants': 'data/restaurants_merged.txt',
            'parkings': 'data/parkings_merged.txt',
            'toilets': 'data/toilets_merged.txt'
        }

    def validate_file(self, file_path: str) -> bool:
        """Validate file existence and content"""
        path = Path(file_path)
        if not path.exists():
            return False

        try:
            with open(path, 'r', encoding='utf-8') as f:
                lines = [
                    line.strip()
                    for line in f.readlines()
                    if line.strip() and not line.startswith('#')
                ]
            return len(lines) > 0
        except Exception as e:
            self._logger.error("ファイル検証エラー", file_path=file_path, error=str(e))
            return False

    def count_queries(self, file_path: str) -> int:
        """Count valid queries in file"""
        if not self.validate_file(file_path):
            return 0

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = [
                    line.strip()
                    for line in f.readlines()
                    if line.strip() and not line.startswith('#')
                ]
            return len(lines)
        except Exception as e:
            self._logger.error("クエリカウントエラー", file_path=file_path, error=str(e))
            return 0

    def run_category_processing(
        self,
        category: CategoryType,
        dry_run: bool = False,
        separate_location: bool = True
    ) -> ProcessingResult:
        """Execute category-specific data processing"""

        # データファイル確認
        data_file = self.data_files.get(category)
        if not data_file:
            raise ConfigurationError(f"未対応カテゴリ: {category}")

        file_path = Path(data_file)
        if not file_path.exists():
            raise ValidationError(f"データファイルが見つかりません: {file_path}")

        # クエリ数確認
        query_count = self.count_queries(str(file_path))
        if query_count == 0:
            raise ValidationError(f"有効なクエリが見つかりません: {file_path}")

        self._logger.info("カテゴリ処理開始",
                         category=category,
                         query_count=query_count,
                         dry_run=dry_run)

        if dry_run:
            self._logger.info("ドライラン完了 - 実際の処理は実行されませんでした")
            return ProcessingResult(
                success=True,
                category=category,
                processed_count=0,
                error_count=0,
                duration=0.0,
                errors=[]
            )

        try:
            # クエリファイル解析
            queries = self._processor.parse_query_file(str(file_path))

            # データ処理実行
            result = self._processor.process_all_queries(queries)
            result.category = category

            # スプレッドシート保存
            if result.success and result.processed_count > 0:
                sheet_name = category.capitalize()
                save_success = self._processor.save_to_spreadsheet(
                    sheet_name,
                    separate_location=separate_location
                )

                if not save_success:
                    self._logger.warning("スプレッドシート保存に失敗")

            self._logger.info("カテゴリ処理完了",
                            category=category,
                            success=result.success,
                            processed_count=result.processed_count,
                            error_count=result.error_count,
                            duration=result.duration)

            return result

        except Exception as e:
            self._logger.error("カテゴリ処理エラー", category=category, error=str(e))
            return ProcessingResult(
                success=False,
                category=category,
                processed_count=0,
                error_count=1,
                duration=0.0,
                errors=[str(e)]
            )

    def run_all_categories(
        self,
        dry_run: bool = False,
        separate_location: bool = True
    ) -> Dict[CategoryType, ProcessingResult]:
        """Execute processing for all categories"""

        results: Dict[CategoryType, ProcessingResult] = {}

        self._logger.info("全カテゴリ処理開始", dry_run=dry_run)

        for category in self.data_files.keys():
            try:
                result = self.run_category_processing(
                    category,
                    dry_run=dry_run,
                    separate_location=separate_location
                )
                results[category] = result

                # カテゴリ間の間隔
                if not dry_run:
                    time.sleep(self._config.processing.api_delay)

            except Exception as e:
                self._logger.error("カテゴリ処理失敗", category=category, error=str(e))
                results[category] = ProcessingResult(
                    success=False,
                    category=category,
                    processed_count=0,
                    error_count=1,
                    duration=0.0,
                    errors=[str(e)]
                )

        # 処理結果サマリー
        total_processed = sum(r.processed_count for r in results.values())
        total_errors = sum(r.error_count for r in results.values())
        total_success = sum(1 for r in results.values() if r.success)

        self._logger.info("全カテゴリ処理完了",
                         total_categories=len(results),
                         successful_categories=total_success,
                         total_processed=total_processed,
                         total_errors=total_errors)

        return results

    def get_processing_summary(self, results: Dict[CategoryType, ProcessingResult]) -> Dict[str, Any]:
        """Generate processing results summary"""

        summary = {
            'total_categories': len(results),
            'successful_categories': sum(1 for r in results.values() if r.success),
            'total_processed': sum(r.processed_count for r in results.values()),
            'total_errors': sum(r.error_count for r in results.values()),
            'total_duration': sum(r.duration for r in results.values()),
            'categories': {}
        }

        for category, result in results.items():
            summary['categories'][category] = {
                'success': result.success,
                'processed_count': result.processed_count,
                'error_count': result.error_count,
                'duration': result.duration,
                'has_errors': len(result.errors) > 0
            }

        return summary
