import pytest
from pydantic import ValidationError

from app.features.clinic.schemas import PatientIn


def valid(**overrides):
    return {"name": " Test Patient ", "age": 30, "gender": "Female", "phone": "+1 555 0100", **overrides}


def test_patient_accepts_valid_record_and_trims_name():
    assert PatientIn(**valid()).name == "Test Patient"


@pytest.mark.parametrize(
    "overrides",
    [{"age": 121}, {"phone": "call me"}, {"gender": "X"}, {"name": "   "}],
)
def test_patient_rejects_invalid_record(overrides):
    with pytest.raises(ValidationError):
        PatientIn(**valid(**overrides))
