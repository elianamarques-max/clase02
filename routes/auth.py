from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/auth", tags=["auth"])

class AuthPayload(BaseModel):
    correo: str
    contraseña: str

# db temporal
usuarios_db: List[AuthPayload] = []

@router.post("/register")
def register(payload: AuthPayload):
    # check duplicate correo
    if any(u.correo == payload.correo for u in usuarios_db):
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    usuarios_db.append(payload)
    return {
        "mensaje": "Registro exitoso",
        "datos": payload,
    }

@router.post("/login")
def login(payload: AuthPayload):
    user = next((u for u in usuarios_db if u.correo == payload.correo and u.contraseña == payload.contraseña), None)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {
        "mensaje": "Login exitoso",
        "datos": payload,
    }
