from __future__ import annotations

from copy import deepcopy

from app.schemas.clients import Client, ClientCreate, ClientUpdate, Vehicle
from app.services.base import BaseService
from app.services.mock_data import get_store


class ClientService(BaseService):
    table_name = "clients"
    vehicle_table_name = "vehicles"

    def __init__(self) -> None:
        super().__init__()
        self.store = get_store()

    def list_clients(self) -> list[Client]:
        if self.using_mock:
            return [Client.model_validate(deepcopy(item)) for item in self.store["clients"]]

        response = self.supabase.table(self.table_name).select("*, vehicles(*)").order("created_at", desc=True).execute()
        return [Client.model_validate(item) for item in response.data]

    def get_client(self, client_id: str) -> Client:
        if self.using_mock:
            record = self._select_one_from_memory(self.store["clients"], "id", client_id, "Cliente")
            return Client.model_validate(record)

        response = (
            self.supabase.table(self.table_name)
            .select("*, vehicles(*)")
            .eq("id", client_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise self._not_found("Cliente")
        return Client.model_validate(response.data[0])

    def create_client(self, payload: ClientCreate) -> Client:
        if self.using_mock:
            client_id = self._new_id("cli")
            vehicles = [
                Vehicle(
                    id=self._new_id("veh"),
                    client_id=client_id,
                    created_at=self._now(),
                    **vehicle.model_dump(),
                ).model_dump(mode="json")
                for vehicle in payload.vehicles
            ]
            record = Client(
                id=client_id,
                created_at=self._now(),
                vehicles=[Vehicle.model_validate(vehicle) for vehicle in vehicles],
                **payload.model_dump(exclude={"vehicles"}),
            ).model_dump(mode="json")
            record["vehicles"] = vehicles
            self.store["clients"].insert(0, record)
            return Client.model_validate(record)

        created_client = (
            self.supabase.table(self.table_name)
            .insert(payload.model_dump(exclude={"vehicles"}))
            .execute()
        )
        client_record = created_client.data[0]

        if payload.vehicles:
            vehicles_payload = [
                {**vehicle.model_dump(), "client_id": client_record["id"]}
                for vehicle in payload.vehicles
            ]
            self.supabase.table(self.vehicle_table_name).insert(vehicles_payload).execute()

        return self.get_client(client_record["id"])

    def update_client(self, client_id: str, payload: ClientUpdate) -> Client:
        update_data = payload.model_dump(exclude_unset=True, exclude={"vehicles"})

        if self.using_mock:
            def updater(record: dict) -> dict:
                record.update(update_data)
                if payload.vehicles is not None:
                    record["vehicles"] = [
                        Vehicle(
                            id=self._new_id("veh"),
                            client_id=client_id,
                            created_at=self._now(),
                            **vehicle.model_dump(),
                        ).model_dump(mode="json")
                        for vehicle in payload.vehicles
                    ]
                return record

            record = self._update_in_memory(self.store["clients"], "id", client_id, updater, "Cliente")
            return Client.model_validate(record)

        if update_data:
            self.supabase.table(self.table_name).update(update_data).eq("id", client_id).execute()

        if payload.vehicles is not None:
            self.supabase.table(self.vehicle_table_name).delete().eq("client_id", client_id).execute()
            vehicles_payload = [
                {**vehicle.model_dump(), "client_id": client_id}
                for vehicle in payload.vehicles
            ]
            if vehicles_payload:
                self.supabase.table(self.vehicle_table_name).insert(vehicles_payload).execute()

        return self.get_client(client_id)

    def delete_client(self, client_id: str) -> None:
        if self.using_mock:
            self._delete_in_memory(self.store["clients"], "id", client_id, "Cliente")
            return

        self.supabase.table(self.vehicle_table_name).delete().eq("client_id", client_id).execute()
        self.supabase.table(self.table_name).delete().eq("id", client_id).execute()
