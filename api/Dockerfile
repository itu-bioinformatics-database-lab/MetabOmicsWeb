FROM python:3.9-slim-bullseye

# --- 1. SYSTEM SETUP (Rarely Changes) ---
ENV JAVA_HOME=/opt/java/openjdk
COPY --from=eclipse-temurin:8-jre $JAVA_HOME $JAVA_HOME
ENV PATH="${JAVA_HOME}/bin:${PATH}"

ENV CELERY_BROKER_URL redis://redis:6379/
ENV CELERY_RESULT_BACKEND redis://redis:6379/
ENV PYTHONPATH=/app

# Install OS dependencies first (Cached until you add a new system tool)
# Added 'swig' and 'libglpk-dev' because 'swiglpk' (required by COBRA) often needs them
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libxml2-dev \
        libxslt-dev \
        swig \
        libglpk-dev \
        git \
    && rm -rf /var/lib/apt/lists/*

    # --- 2. CPLEX INSTALLATION (Registered Version) ---
# We do this BEFORE python requirements so the engine is ready.

# Define arguments for flexibility
ARG CPLEX_INSTALLER=cplex_studio2211.linux_x86_64.bin
ARG CPLEX_HOME=/opt/ibm/ILOG/CPLEX_Studio

# Copy installer and silent config
COPY ${CPLEX_INSTALLER} /tmp/cplex_installer.bin
COPY response.properties /tmp/response.properties

# Run the installer
RUN chmod +x /tmp/cplex_installer.bin && \
    /tmp/cplex_installer.bin -f /tmp/response.properties && \
    rm /tmp/cplex_installer.bin /tmp/response.properties

# Install the CPLEX Python API into the system python
WORKDIR ${CPLEX_HOME}/python
RUN python setup.py install

# CRITICAL: Set LD_LIBRARY_PATH so Python can find the CPLEX C++ binaries at runtime
ENV LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:${CPLEX_HOME}/cplex/bin/x86-64_linux"

# --- 3. PYTHON DEPENDENCIES (Changes occasionally) ---
WORKDIR /app

# Install uv
RUN pip install uv

# Copy ONLY requirements first. 
# This layer is cached unless requirements.txt changes.
COPY requirements.txt .

# Install dependencies using uv (Fast & Cached)
RUN uv pip install --system --no-cache -r requirements.txt

# --- 4. SOURCE CODE (Changes frequently) ---
# Copy source code LAST. Changing code will only re-run steps after this line.
COPY . /app

# --- 5. RUNTIME ---
# Ensure we are in the correct directory for gunicorn
WORKDIR /app/src

EXPOSE 5000

# WARNING: This generates a secret at BUILD time (baked into the image).
# If you want a unique secret per container start, move this to a shell script (entrypoint).
RUN python main.py generate-secret

# Run the app
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers=2", "app:app"]