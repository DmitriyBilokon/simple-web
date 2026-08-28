FROM python:3.12-slim

EXPOSE 80
WORKDIR /code
COPY index.py /code/index.py
RUN touch /code/index.html

CMD ["python", "-u", "index.py"]
