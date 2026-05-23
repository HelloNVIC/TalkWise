import webbrowser
import uvicorn


def main():
    host = "0.0.0.0"
    port = 8000
    url = f"http://localhost:{port}"
    webbrowser.open(url)
    uvicorn.run("app.main:app", host=host, port=port, reload=True)


if __name__ == "__main__":
    main()
