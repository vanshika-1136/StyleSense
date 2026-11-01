FROM node:22-bookworm

WORKDIR /app

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv

# Use the Python virtual environment by default
ENV PATH="/opt/venv/bin:$PATH"

# Install Node dependencies
COPY package*.json ./
RUN npm ci

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Your Node server
EXPOSE 5000

CMD ["node", "server.js"]