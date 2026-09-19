FROM python:3.12-slim AS builder
WORKDIR /build
COPY pyproject.toml ./
COPY app ./app
RUN pip wheel --no-cache-dir --wheel-dir=/wheels .

FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /srv/finni
COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels && useradd --uid 10001 --create-home finni
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
COPY content ./content
USER finni
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]

FROM runtime AS test
USER root
COPY pyproject.toml ./
COPY tests ./tests
RUN pip install --no-cache-dir '.[test]'
USER finni

FROM runtime AS production