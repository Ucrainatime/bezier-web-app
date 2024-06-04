#include <cstdlib>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>

#include "http.h"

using namespace std;


void saveBZC(string projectName, vector<vector<int>> points) {
    ofstream myfile;
    myfile.open ("./projects/" + projectName);
    for (auto point : points) {
        myfile << point[0] << ' ' << point[1] << ' ' << point[2] << endl;
    }
    myfile.close();
}

Response listBezierProjects(Request request) {
    if (request.method != "GET") {
        return {"Method not allowed", {}, 405};
    }

    string filenameList = "";
    for ( auto & entry : std::filesystem::directory_iterator("./projects/")) {
        filenameList += entry.path().filename();
        filenameList += "\n";
    }
    filenameList = filenameList.substr(0, -2);

    return {filenameList, {{"access-control-allow-origin", "*"}}, 200};
}

Response saveBezierProject(Request request) {
    // id x y, id x y
    vector<vector<int>> points;
    vector<int> point;
    string point_raw;

    string projectName = request.args[0][1];

    cout << "'" << projectName << "'" << endl;

    int start = 0;
    int end = -2;

    while (true) {
        point.clear();

        int data_end = 0;
        int data_start = 0;

        end = request.data.find(", ", end+2);
        point_raw = request.data.substr(start, end-start);
        cout << point_raw << endl;
        while (true) {
            data_end = point_raw.find(" ", data_end+1);
            string data = point_raw.substr(data_start, data_end-data_start);
            cout << data << endl;
            point.push_back(stoi(data));
            
            if (data_end == string::npos) {
                break;
            }

            data_start = data_end + 1;
        }

        points.push_back(point);

        if (end == string::npos) {
            break;
        }

        start = end+2;
    }

    saveBZC(projectName, points);

    return {"ok", {{"access-control-allow-origin", "*"}}, 200};
}

Response loadBezierProject(Request request) {
    string file = "./projects/" + request.args[0][1];
    cout << file << endl;

    if (!fileExists(file)) {
        return {"File Not Found", {}, 404};
    }

    return {file_contents(file), {{"access-control-allow-origin", "*"}}, 200};

}

Response projectRequest(Request request) {
    if (request.method == "GET") {
        return loadBezierProject(request);
    } else if (request.method == "POST") {
        return saveBezierProject(request);
    }

    return {"Method not allowed", {{"access-control-allow-origin", "*"}}, 405};
}

/*
save: POST /project?file=[NOME]
read: GET  /project?file=[NOME]
delete: DELETE /project?file=[NOME]
*/

int main() {
    HTTPServer server{5050};

    srand(time(NULL));

    bool enableReuseAddr = true;
    setsockopt(server.serverSocket, SOL_SOCKET, SO_REUSEADDR, &enableReuseAddr, sizeof(int));

    server.endpoint({"/project", projectRequest});
    server.endpoint({"/list", listBezierProjects});

    server.serve(100);
}
