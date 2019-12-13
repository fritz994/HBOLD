#-*- coding: utf-8 -*-


import flask
import requests

app = flask.Flask(__name__)

method_requests_mapping = {
    'GET': requests.get,
    'HEAD': requests.head,
    'POST': requests.post,
    'PUT': requests.put,
    'DELETE': requests.delete,
    'PATCH': requests.patch,
    'OPTIONS': requests.options,
}


@app.route('/<path:url>', methods=method_requests_mapping.keys())
def proxy(url):
    requests_function = method_requests_mapping[flask.request.method]
    request = requests_function(url, stream=True, params=flask.request.args)

    print(request)

    response = flask.Response(flask.stream_with_context(request.iter_content()),
                              content_type=request.headers['content-type'],
                              status=request.status_code)

    print(response)

    if flask.request.environ['HTTP_ORIGIN'] is not None:
        response.headers['Access-Control-Allow-Origin'] = flask.request.environ['HTTP_ORIGIN']
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
	#response.headers['Access-Control-Allow-Origin'] = 'http://127.0.0.1:8891'
    return response


if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=8892)
