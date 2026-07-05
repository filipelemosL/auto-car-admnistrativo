from __future__ import annotations

from copy import deepcopy
from io import BytesIO

from app.schemas.service_reports import (
    ImageAttachmentRequest,
    ServiceReport,
    ServiceReportCreate,
    ServiceReportUpdate,
)
from app.services.base import BaseService
from app.services.mock_data import get_store, save_store
from app.templates.pdf_builders import build_service_report_pdf


class ServiceReportService(BaseService):
    table_name = "service_reports"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()

    def list_reports(self) -> list[ServiceReport]:
        if self.using_mock:
            return [ServiceReport.model_validate(deepcopy(item)) for item in self.store["service_reports"]]

        response = self.supabase.table(self.table_name).select("*").order("check_in_at", desc=True).execute()
        return [ServiceReport.model_validate(item) for item in response.data]

    def get_report(self, report_id: str) -> ServiceReport:
        if self.using_mock:
            record = self._select_one_from_memory(self.store["service_reports"], "id", report_id, "Relatorio de servico")
            return ServiceReport.model_validate(record)

        response = self.supabase.table(self.table_name).select("*").eq("id", report_id).limit(1).execute()
        if not response.data:
            raise self._not_found("Relatorio de servico")
        return ServiceReport.model_validate(response.data[0])

    def create_report(self, payload: ServiceReportCreate) -> ServiceReport:
        data = payload.model_dump()
        data["check_in_at"] = data["check_in_at"] or self._now()

        if self.using_mock:
            record = ServiceReport(
                id=self._new_id("srv"),
                created_at=self._now(),
                **data,
            ).model_dump(mode="json")
            self.store["service_reports"].insert(0, record)
            save_store()
            return ServiceReport.model_validate(record)

        response = self.supabase.table(self.table_name).insert(data).execute()
        return ServiceReport.model_validate(response.data[0])

    def update_report(self, report_id: str, payload: ServiceReportUpdate) -> ServiceReport:
        update_data = payload.model_dump(exclude_unset=True)

        if self.using_mock:
            record = self._update_in_memory(
                self.store["service_reports"],
                "id",
                report_id,
                lambda item: {**item, **update_data},
                "Relatorio de servico",
            )
            return ServiceReport.model_validate(record)

        self.supabase.table(self.table_name).update(update_data).eq("id", report_id).execute()
        return self.get_report(report_id)

    def delete_report(self, report_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["service_reports"], "id", report_id, "Relatorio de servico")
            return

        self.supabase.table(self.table_name).delete().eq("id", report_id).execute()

    def append_image(self, report_id: str, payload: ImageAttachmentRequest) -> ServiceReport:
        report = self.get_report(report_id)
        updated_images = [*report.images, payload.image_url]
        return self.update_report(report_id, ServiceReportUpdate(images=updated_images))

    def build_pdf_export(self, report_id: str) -> BytesIO:
        report = self.get_report(report_id)
        return build_service_report_pdf(report)
