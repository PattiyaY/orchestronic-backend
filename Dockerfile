FROM apache/airflow:2.10.4-python3.10

# Copy and install your Python dependencies
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt
