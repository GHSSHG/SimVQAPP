from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any
import math
import uuid

from .errors import DependencyError


@dataclass(frozen=True)
class Pod5ReadTemplate:
    read_id: str
    pore: dict[str, Any]
    calibration: dict[str, Any]
    read_number: int
    start_sample: int
    median_before: float
    end_reason_index: int
    run_info_index: int
    num_minknow_events: int
    tracked_scaling: dict[str, Any]
    predicted_scaling: dict[str, Any]
    num_reads_since_mux_change: int
    time_since_mux_change: float
    open_pore_level: float


class Pod5TemplateSerializer:
    def extract_from_record(self, record: Any) -> Pod5ReadTemplate:
        read = record.to_read() if hasattr(record, "to_read") else record
        run_info_index = int(getattr(record, "run_info_index", 0))
        end_reason_index = int(getattr(record, "end_reason_index", 0))
        return Pod5ReadTemplate(
            read_id=str(read.read_id),
            pore=self._serialize_pore(read.pore),
            calibration=self._serialize_calibration(read.calibration),
            read_number=int(read.read_number),
            start_sample=int(read.start_sample),
            median_before=self._float_to_json(float(read.median_before)),
            end_reason_index=end_reason_index,
            run_info_index=run_info_index,
            num_minknow_events=int(read.num_minknow_events),
            tracked_scaling=self._serialize_shift_scale_pair(read.tracked_scaling),
            predicted_scaling=self._serialize_shift_scale_pair(read.predicted_scaling),
            num_reads_since_mux_change=int(read.num_reads_since_mux_change),
            time_since_mux_change=self._float_to_json(float(read.time_since_mux_change)),
            open_pore_level=self._float_to_json(float(read.open_pore_level)),
        )

    def build_pod5_read(self, template: Pod5ReadTemplate, signal, tables: Any) -> Any:
        pod5 = require_pod5()
        run_info = self._deserialize_run_info(tables["run_infos"][int(template.run_info_index)])
        end_reason = self._deserialize_end_reason(tables["end_reasons"][int(template.end_reason_index)])
        shift_scale_pair = pod5.pod5_types.ShiftScalePair
        return pod5.Read(
            read_id=uuid.UUID(str(template.read_id)),
            pore=pod5.Pore(**template.pore),
            calibration=pod5.Calibration(**template.calibration),
            read_number=int(template.read_number),
            start_sample=int(template.start_sample),
            median_before=self._json_to_float(template.median_before),
            end_reason=end_reason,
            run_info=run_info,
            num_minknow_events=int(template.num_minknow_events),
            tracked_scaling=shift_scale_pair(**self._deserialize_shift_scale_pair(template.tracked_scaling)),
            predicted_scaling=shift_scale_pair(**self._deserialize_shift_scale_pair(template.predicted_scaling)),
            num_reads_since_mux_change=int(template.num_reads_since_mux_change),
            time_since_mux_change=self._json_to_float(template.time_since_mux_change),
            open_pore_level=self._json_to_float(template.open_pore_level),
            signal=signal,
        )

    @staticmethod
    def _float_to_json(value: float) -> float | None:
        return value if math.isfinite(value) else None

    @staticmethod
    def _json_to_float(value: float | None) -> float:
        if value is None:
            return float("nan")
        return float(value)

    @classmethod
    def _serialize_pore(cls, pore: Any) -> dict[str, Any]:
        return {
            "channel": int(pore.channel),
            "well": int(pore.well),
            "pore_type": str(pore.pore_type),
        }

    @classmethod
    def _serialize_calibration(cls, calibration: Any) -> dict[str, Any]:
        return {
            "offset": float(calibration.offset),
            "scale": float(calibration.scale),
        }

    @classmethod
    def _serialize_shift_scale_pair(cls, value: Any) -> dict[str, Any]:
        return {
            "shift": cls._float_to_json(float(value.shift)),
            "scale": cls._float_to_json(float(value.scale)),
        }

    @classmethod
    def _deserialize_shift_scale_pair(cls, value: dict[str, Any]) -> dict[str, float]:
        return {
            "shift": cls._json_to_float(value.get("shift")),
            "scale": cls._json_to_float(value.get("scale")),
        }

    @classmethod
    def serialize_end_reason(cls, end_reason: Any) -> dict[str, Any]:
        return {
            "reason": str(end_reason.reason.name),
            "forced": bool(end_reason.forced),
        }

    @classmethod
    def _deserialize_end_reason(cls, payload: dict[str, Any]) -> Any:
        pod5 = require_pod5()
        return pod5.EndReason(
            reason=pod5.EndReasonEnum[str(payload["reason"])],
            forced=bool(payload.get("forced", False)),
        )

    @classmethod
    def serialize_run_info(cls, run_info: Any) -> dict[str, Any]:
        data = asdict(run_info)
        data["acquisition_start_time"] = cls._serialize_datetime(run_info.acquisition_start_time)
        data["protocol_start_time"] = cls._serialize_datetime(run_info.protocol_start_time)
        return data

    @classmethod
    def _deserialize_run_info(cls, payload: dict[str, Any]) -> Any:
        pod5 = require_pod5()
        return pod5.RunInfo(
            acquisition_id=str(payload["acquisition_id"]),
            acquisition_start_time=cls._deserialize_datetime(payload["acquisition_start_time"]),
            adc_max=int(payload["adc_max"]),
            adc_min=int(payload["adc_min"]),
            context_tags={str(k): str(v) for k, v in dict(payload["context_tags"]).items()},
            experiment_name=str(payload["experiment_name"]),
            flow_cell_id=str(payload["flow_cell_id"]),
            flow_cell_product_code=str(payload["flow_cell_product_code"]),
            protocol_name=str(payload["protocol_name"]),
            protocol_run_id=str(payload["protocol_run_id"]),
            protocol_start_time=cls._deserialize_datetime(payload["protocol_start_time"]),
            sample_id=str(payload["sample_id"]),
            sample_rate=int(payload["sample_rate"]),
            sequencing_kit=str(payload["sequencing_kit"]),
            sequencer_position=str(payload["sequencer_position"]),
            sequencer_position_type=str(payload["sequencer_position_type"]),
            software=str(payload["software"]),
            system_name=str(payload["system_name"]),
            system_type=str(payload["system_type"]),
            tracking_id={str(k): str(v) for k, v in dict(payload["tracking_id"]).items()},
        )

    @staticmethod
    def _serialize_datetime(value: datetime | None) -> str | None:
        if value is None:
            return None
        return value.isoformat()

    @staticmethod
    def _deserialize_datetime(value: str | None) -> datetime:
        if value is None:
            raise ValueError("datetime value is required")
        return datetime.fromisoformat(value)


def require_pod5() -> Any:
    try:
        import pod5  # type: ignore
    except Exception as exc:
        raise DependencyError(f"pod5 is required for POD5 encode/decode workflows: {exc}") from exc
    return pod5
