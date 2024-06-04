#include "http.h"

#include <iostream>

#define ERR_404 Response{"<h1>404 - Page Not Found</h1>", {}, 404}
using namespace std;

bool fileExists(string fileName)
{
    std::ifstream infile(fileName);
    return infile.good();
}

string file_contents(string filename) {
    ifstream t(filename);
    stringstream buffer;
    buffer << t.rdbuf();
    return buffer.str();
}

// HTTP Server
HTTPServer::HTTPServer(int port) {
    this->port = port;
    serverSocket = socket(AF_INET, SOCK_STREAM, 0);
}

void HTTPServer::serve(int backlog = 100) {
    serverAddress.sin_family = AF_INET;
    serverAddress.sin_port = htons(port);
    serverAddress.sin_addr.s_addr = INADDR_ANY;
    cout << "Hosting on http://localhost:" << port << endl;

	int res = bind(serverSocket, (struct sockaddr*)&serverAddress,  sizeof(serverAddress)); 
    if (res < 0 ) {
        cout << "[BIND] Error Code: " << (errno) << endl;
        return;
    }
	listen(serverSocket, backlog);

    while (true) {
	    clientSocket = accept(serverSocket, nullptr, nullptr); 
        if (clientSocket < 0) break;
        
        handleClient(clientSocket);
    }
    cout << "error code: " << (errno) << endl;
    close(serverSocket);
}

Response HTTPServer::processRequest(Request request) {
    // /utente/123/info?hide=pwd
    // CALLBACK(endpoint): /utente/123/info
    // ARGUMENTS: hide

    for (Callback callback : callbacks) {
        if (request.endpoint == callback.endpoint) {
            return callback.callback(request);
        }
    }

    for (vector<string> staticPath : statics) {
        if (request.endpoint.rfind(staticPath[0], 0) == 0) {
            if (fileExists(staticPath[1] + request.endpoint)) {
                return {file_contents(staticPath[1] + request.endpoint), {}, 200};
            } else {
                return ERR_404;
            }
        }
    }

    return ERR_404;
}


void HTTPServer::handleClient(int client) {
	char bufferRecv[BUFFER_LEN] = {'\0'};
    char bufferSend[BUFFER_LEN] = {'\0'};
    string responseStr;
    string requestStr = "";

    // Riceve la richiesta dal browser
    int byteCount = BUFFER_LEN - 1;
    while (byteCount >= BUFFER_LEN-1) {
        byteCount = recv(clientSocket, bufferRecv, sizeof(bufferRecv)-1, 0); 
        bufferRecv[BUFFER_LEN-1] = '\0';
        requestStr += bufferRecv;
        cout << byteCount << endl;
    }
    cout << "Done" << endl;    
    cout << requestStr << endl;

    Request request{clientSocket, requestStr.c_str()};
    //cout << request.method << " " << request.endpoint << endl;

    Response response = processRequest(request);
    response.sendTo(client);

    // Chiusura Connessione
    close(clientSocket);
}

void HTTPServer::endpoint(Callback callback) {
    this->callbacks.push_back(callback);
}

void HTTPServer::staticFiles(string endpoint, string path) {
    this->statics.push_back({endpoint, path});
}

// Request
Request::Request(int client, string raw_data) {
    this->raw_data = raw_data;
    this->client = client;
    
    fullUrl = getFullUrl();
    endpoint = getEndpoint();
    method = getMethod();
    data = getData();
    args = getArgs();
}

string Request::getData() {
    int index = raw_data.find("\r\n\r\n");
    string data = raw_data.substr(index+4, raw_data.length()-index-4);
    return data;
}

string Request::getMethod() {
    return raw_data.substr(0, raw_data.find(" "));
}

string Request::getEndpoint() {
    int argsStart = fullUrl.find("?");
    return fullUrl.substr(0, argsStart);
}

string Request::getFullUrl() {
    int spaceIndex = raw_data.find(" ");
    string path = raw_data.substr(spaceIndex+1, raw_data.length()-spaceIndex);
    return path.substr(0, path.find(" "));
}

Arguments Request::getArgs() {
    // /qualcosa?id=123&name=ciao
    int argsStartIndex = fullUrl.find("?");
    if (argsStartIndex == -1) return {};
    argsStartIndex += 1;

    string arguments = fullUrl.substr(argsStartIndex, endpoint.length()-argsStartIndex);

    int endArg = 0;
    int startArg = 0;

    while (true) {
        endArg = arguments.find("&", endArg+1);
        
        string argument = arguments.substr(startArg, endArg-startArg);
        
        int sepIndex = argument.find("=");
        string key = argument.substr(0, sepIndex);
        string value = argument.substr(sepIndex+1, argument.length()-sepIndex-1);

        cout << key << " = " << value << endl;
        args.push_back({key, value});

        if (endArg == string::npos) {
            break;
        }

        startArg = endArg + 1;
    }

    return args;
}

// Response
Response::Response(std::string data, Headers headers, int status) {
    this->data = data;
    this->headers = headers;
    this->status = status;

    this->headers.push_back({"Content-Length", to_string(data.length())});
}

string Response::raw() {
    string sep = "\r\n";
    string response = "HTTP/1.1 " + to_string(status) + sep;

    for (auto header : headers) {
        response += header[0] + ": " + header[1] + sep;
    }
    response += sep + data;
    cout << response << endl;

    return response;
}

void Response::sendTo(int client) {
    char bufferSend[BUFFER_LEN] = {0};
    string raw_data = raw();

    for (int i = 0; i <= raw_data.length(); i += BUFFER_LEN) {
        strcpy(bufferSend, raw_data.substr(i, BUFFER_LEN).c_str());
        send(client, bufferSend, raw_data.length(), 0);
    }
}

// Callback 
Callback::Callback(std::string endpoint, Response (*callback)(Request request)) {
    this->endpoint = endpoint;
    this->callback = callback;
}
