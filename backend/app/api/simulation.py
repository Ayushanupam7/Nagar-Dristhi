from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.simulation_service import SimulationService
from app.database.seed import seed_database
from app.models.event import Event
from app.models.issue import Issue
from app.models.traffic import TrafficObservation
from app.models.incident import Incident
from app.models.bus import Bus
from app.models.user import User
from app.api.ws import ws_manager

router = APIRouter(prefix="/simulation", tags=["Simulation & Live Demo"])


@router.post("/advance-fleet")
async def advance_fleet(db: Session = Depends(get_db)):
    """Advance bus coordinates along their transit routes by 1 simulation tick."""
    sim_service = SimulationService(db)
    updated_buses = sim_service.advance_fleet_locations()
    
    await ws_manager.broadcast({
        "type": "FLEET_UPDATE",
        "buses": updated_buses
    })
    return {"status": "SUCCESS", "updated_buses_count": len(updated_buses), "buses": updated_buses}


@router.post("/sih-demo/step/{step}")
async def run_sih_demo_step(step: int, db: Session = Depends(get_db)):
    """
    Run one of the 12 steps in the Live Fleet Demonstration Flow.
    Returns step metadata and triggers live WebSocket updates.
    """
    if step < 1 or step > 12:
        raise HTTPException(status_code=400, detail="Step must be between 1 and 12")

    sim_service = SimulationService(db)
    result = sim_service.trigger_sih_step(step)

    await ws_manager.broadcast({
        "type": "SIH_DEMO_STEP",
        "data": result
    })
    return result


@router.post("/reset-db")
def reset_database(db: Session = Depends(get_db)):
    """Reset database and re-seed clean demonstration state."""
    db.query(Event).delete()
    db.query(Issue).delete()
    db.query(TrafficObservation).delete()
    db.query(Incident).delete()
    db.query(Bus).delete()
    db.query(User).delete()
    db.commit()

    seed_database()
    return {"status": "SUCCESS", "message": "Database reset and re-seeded with Pune transit data"}


@router.post("/import-real-dataset")
async def import_real_dataset_endpoint():
    """
    Import and sync curated real-world road defect datasets (Kaggle Pothole + RDD2020/2022 India)
    directly into Supabase PostgreSQL.
    """
    from app.scripts.import_kaggle_dataset import import_kaggle_dataset
    try:
        res = import_kaggle_dataset(dry_run=False)
        await ws_manager.broadcast({
            "type": "DATASET_IMPORTED",
            "data": res
        })
        return {"status": "SUCCESS", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset import failed: {str(e)}")

