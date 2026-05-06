from fastapi import FastAPI


app = FastAPI(title="Koupreng Invitation Service")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
