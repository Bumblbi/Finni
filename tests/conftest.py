import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.content import seed
from app.db import Base, get_db, make_engine
from app.main import app


@pytest.fixture
def client(tmp_path):
    # TEST_DATABASE_URL must point to a disposable, isolated PostgreSQL database.
    engine = make_engine(os.getenv("TEST_DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}"))
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory.begin() as db:
        seed(db, "content/catalog.json")

    def override():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()
