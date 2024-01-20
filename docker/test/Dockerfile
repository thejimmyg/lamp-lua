FROM python:3.11

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chromium chromium-driver && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir selenium

RUN mkdir /test
RUN mkdir -m 606 /test/screenshots
# Why are these exact permissions required and not more restricted ones?
# Cache folder (/.cache/selenium) cannot be created: Permission denied (os error 13)
RUN mkdir -m 770 /.cache

WORKDIR /test
CMD [ "python", "./test.py" ]
