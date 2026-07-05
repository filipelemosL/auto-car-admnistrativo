from datetime import datetime

from pydantic import BaseModel, Field


class VehicleBase(BaseModel):
    brand: str
    model: str
    plate: str
    year: int = Field(ge=1950, le=2100)
    color: str = ""
    mileage: int = Field(ge=0)
    status: str = "Em dia"


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    brand: str | None = None
    model: str | None = None
    plate: str | None = None
    year: int | None = Field(default=None, ge=1950, le=2100)
    color: str | None = None
    mileage: int | None = Field(default=None, ge=0)
    status: str | None = None


class Vehicle(VehicleBase):
    id: str
    client_id: str
    created_at: datetime | None = None


class ClientBase(BaseModel):
    name: str
    phone: str
    cpf_cnpj: str = ""
    email: str = ""
    city: str
    lifetime_value: float = Field(default=0, ge=0)
    last_visit: datetime | None = None


class ClientCreate(ClientBase):
    vehicles: list[VehicleCreate] = Field(default_factory=list)


class ClientUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    lifetime_value: float | None = Field(default=None, ge=0)
    last_visit: datetime | None = None
    vehicles: list[VehicleCreate] | None = None


class Client(ClientBase):
    id: str
    created_at: datetime | None = None
    vehicles: list[Vehicle] = Field(default_factory=list)
