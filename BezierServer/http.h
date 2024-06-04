#ifndef LIB_HTTP_SERVER
#define LIB_HTTP_SERVER

#include <algorithm>
#include <cerrno>
#include <iostream> 
#include <netinet/in.h> 
#include <string>
#include <unistd.h> 
#include <string.h>
#include <fstream>
#include <sstream>
#include <vector>

#define BUFFER_LEN 4096
typedef std::vector<std::vector<std::string>> Headers;
typedef std::vector<std::vector<std::string>> Arguments;

bool fileExists(std::string fileName);
std::string file_contents(std::string filename);

class Request {
    private:
    int client;
    std::string raw_data;
    std::string getMethod();
    std::string getEndpoint();
    std::string getFullUrl();
    std::string getData();
    Arguments getArgs();

    public:
    std::string method;
    std::string fullUrl;
    std::string endpoint;
    std::string data = "";
    Arguments args = {};
    Headers headers;

    Request(int client, std::string raw_data);
};

class Response {
    public:
    std::string data;
    int status;
    Headers headers;

    Response(std::string data, Headers headers, int status);
    std::string raw();
    void sendTo(int client);
};

class Callback {
    public:
    std::string endpoint;
    Response (*callback)(Request request);

    Callback(std::string endpoint, Response (*callback)(Request request));
};


class HTTPServer {
    private:
    int port;
    int clientSocket;
    sockaddr_in serverAddress;
    std::vector<Callback> callbacks;
    std::vector<std::vector<std::string>> statics;

    public:
    int serverSocket;

    HTTPServer(int port);
    void serve(int backlog);
    void endpoint(Callback callback);
    void staticFiles(std::string endpoint, std::string path);
    void handleClient(int client);
    Response processRequest(Request request);
};

#endif
