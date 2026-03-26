from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/servicios", tags=["servicios"])

class Servicio(BaseModel):
    nombre: str
    precio: float

servicios_db = [
    {"nombre": "consulta", "precio": 50},
    {"nombre": "baño", "precio": 60},
    {"nombre": "corte", "precio": 100},
]

@router.get("/", response_model=List[Servicio])
def listar_servicios():
    return servicios_db

@router.post("/agregar", response_model=Servicio)
def agregar_servicio(nuevo: Servicio):
    servicios_db.append(nuevo.dict())
    return nuevo

class MascotaRegistro(BaseModel):
    correo: str
    nombre_mascota: str
    tipo_servicio: str
    fecha: str

mascotas_db: List[MascotaRegistro] = []

@router.post("/registrar-mascota")
def registrar_mascota(registro: MascotaRegistro):
    mascotas_db.append(registro)
    return {
        "mensaje": "Mascota registrada correctamente",
        "registro": registro,
    }

@router.get("/mascotas/{correo}")
def listar_mascotas_por_dueno(correo: str):
    mascotas = [m for m in mascotas_db if m.correo == correo]
    return {
        "correo": correo,
        "mascotas": mascotas,
    }

@router.get("/reporte/{correo}")
def reporte_por_dueno(correo: str):
    mascotas = [m for m in mascotas_db if m.correo == correo]
    total = 0.0
    servicios_registrados = []

    for m in mascotas:
        servicios_registrados.append(m.tipo_servicio)
        servicio_info = next((s for s in servicios_db if s["nombre"] == m.tipo_servicio), None)
        if servicio_info:
            total += servicio_info["precio"]

    return {
        "correo": correo,
        "cantidad_servicios": len(mascotas),
        "servicios": servicios_registrados,
        "gasto_total": total,
    }
