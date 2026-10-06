FROM python:3.11-slim

WORKDIR /app

# openslide-bin provides the native OpenSlide library as a wheel — no apt needed.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV SLIDES_DIR=/slides
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
