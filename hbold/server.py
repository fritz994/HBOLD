import sys
sys.path.append(r"..")                            # inserire il percorso della cartella con downloadDataset,automaticExtraction,....
sys.path.append(r"../extractor")
sys.path.append(r"../util")

import os
import motor
import pprint
import smtplib   # serve per mandare la mail
import ssl
import time
from downloadDataset import downloadDataset as dd
from downloadDataset import downloadPortal as dp
import PostProcesingClusteredV3 as ppc
import SchemaExtractorTestV3 as se

from time import time, ctime

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import tornado
from tornado import gen
from tornado import web
from tornado import ioloop
from tornado import template
from tornado.httpclient import AsyncHTTPClient

from contextlib import redirect_stdout                                                  # serve per la redirezione di downloadDataset
from operator import itemgetter

exclusion = []


#### mi serve una struttura dati in cui memorizzo gli ip che fanno le richieste e il momento in cui la fanno
#### usiamo un dict in cui l'ip <C3><A8> la chiave ed il valore <C3><A8> una lista delle richieste... le richieste vengono aggiunte in coda e, se sono pi<C3><B9> vecchie di x tempo dall'istante attuale si eliminano

#### questa cosa la controllo solo quando mi arriva una nuova richiesta... sarebbe carino fare un decoratore per la funzione proxy.get

annoying_ip={}
def check_ip(func):
    def function_wrapper(self, url):
	#controllo che un ip non faccia più di 10 chiamate al minuto
        #import pbb;pdb.set_trace()
        #ip = self.request.remote_ip
        ip = self.request.headers["X-Forwarded-For"]
        now = time()
        to_return = "OK"

        with open("log_richieste.txt", "a") as so:
            so.write(f"{ctime(now)} --- {ip} --- {self.request.uri.split('hbold/proxy/')[1]}")

        if ip not in annoying_ip.keys():
            annoying_ip[ip] = list()
            annoying_ip["count"] = 0

        annoying_ip[ip].append(now)
        annoying_ip["count"] += 1

        if len(annoying_ip[ip]) > 10:
            if now - annoying_ip[ip][0] < 60:
                to_return = "NO"

            #tolgo tutte le entry che sono più vecchie di 60 secondi
            index = 0
            for i in range(len(annoying_ip[ip])):
                if now - 60 < annoying_ip[ip][i]:
                    index = i
                    break
            annoying_ip[ip] = annoying_ip[ip][index:]

        if to_return == "NO":
            self.write("Too many requests, wait some time")
        else:
            return func(self, url)
    return function_wrapper

def correct_url(url):
    if not ((url.startswith("http://") or url.startswith("https://"))):
        if url.startswith("https"):
            url = url.replace("https:/","https://")
        elif url.startswith("http"):
            url = url.replace("http:/","http://")
    return url


class proxy(tornado.web.RequestHandler):
    @check_ip
    @gen.coroutine
    def get(self, url):
        print(url)
        #url tagliato dopo il carattere ? quindi lo prendo da request
        #url = self.request.uri[1:]
        url = self.request.uri.split("hbold/proxy/")[1]
        print(url)

        url = correct_url(url)

        sparql_request = tornado.httpclient.HTTPRequest(url=url, headers={"Accept":"application/sparql-results+json", "charset":"UTF-8"})

        http_client = AsyncHTTPClient()
        response = yield http_client.fetch(sparql_request)

        self.write(response.body.decode())


class redirecter(tornado.web.RequestHandler):
    def get(self):
        self.redirect("../hbold/")


class MainHandlerOk(tornado.web.RequestHandler):
    def get(self):
        #self.set_header('Content-Type', '') # I have to set this header
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        #self.render('LODeX_template.html', loader = template.BaseLoader)
        with open('templates/LODeX.html', 'r') as file:
            self.write(file.read())

class About(tornado.web.RequestHandler):
    def get(self):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        self.render('about.html')

class SchemaSummary(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato SS con id ',endpoint_id)
        self.render('ss.html')

class HiericalSS(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato SS con id ',endpoint_id)
        self.render('sshier.html')

# classe che viene chiamata quando si espande il cluster schema
class ExploreSS(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        self.render('exploreSS.html')

class ClusterSchema(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato CS con id ',endpoint_id)
        self.render('cs.html')

class TreemapCS(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato SS con id ',endpoint_id)
        self.render('treemap.html')

class SunburstCS(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato CS con id ',endpoint_id)
        self.render('sunburst.html')

class CirclePackCS(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato CS con id ',endpoint_id)
        self.render('circlepack.html')


# associata a ./index
class IndexDatasetHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        exid = [a['_id'] for a in exclusion]
        # pprint.pprint(exid)
        db = self.settings['db']
        cursor = db.lodex.ike.find({'ss': {'$exists': True}, '_id': {'$nin': exid}})
        res = []
        while (yield cursor.fetch_next):
            tmp = cursor.next_object()
            res.append({'id': tmp['_id'], 'name': tmp['name'] if 'name' in tmp else None,
                        'uri': tmp['uri'], 'triples': tmp['triples'] if 'triples' in tmp else None,
                        'instances': tmp['instances'] if 'instances' in tmp else None,
                        'propCount': len(tmp['propList']) if 'propList' in tmp else None,
                        'classesCount': len(tmp['classes']) if 'classes' in tmp else None})
        self.content_type = 'application/json'
        print('Pagina Home con', len(res) , 'dataset')         # stampa sul prompt il numero dei dataset trovati
        self.write({'data': res})                              # scrive su ./index il JSON dei dataset trovati
        self.finish()


#associata a ./indexComplete
class IndexDatasetHandlerFull(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        exid = [a['_id'] for a in exclusion]
        #pprint.pprint(exid)
        db = self.settings['db']  #
        cursor = db.lodex.ike.find({'ss': {'$exists': True}, '_id': {'$nin': exid}})
        res = []
        while (yield cursor.fetch_next):
            tmp = cursor.next_object()
            res.append({'id': tmp['_id'], 'name': tmp['name'] if 'name' in tmp else None,
                        'uri': tmp['uri'], 'triples': tmp['triples'] if 'triples' in tmp else None,
                        'instances': tmp['instances'] if 'instances' in tmp else None,
                        'propCount': len(tmp['propList']) if 'propList' in tmp else None,
                        'classesCount': len(tmp['classes']) if 'classes' in tmp else None,
                        'classList': tmp['classes'] if 'classes' in tmp else None,              # aggiunte rispetto alla classe sopra: stampano tutte
                        'propList': tmp['propList'] if 'propList' in tmp else None              # le classi e tutte le proprietà
                        })
        self.content_type = 'application/json'
        self.write({'data': res})
        self.finish()


class GraphHandler(tornado.web.RequestHandler):
    def get(self, endpoint_id):
        self.render('insertDataset.html')


class InsertDataset(tornado.web.RequestHandler):
    def get(self):
        self.set_header('Content-Type', '')
        self.render('insertDataset.html')


class Inserting(tornado.web.RequestHandler):
    def get(self, end):
        self.set_header('Content-Type', '')
        self.redirect('/hbold/')

        mail, endp = itemgetter(0, 1)(end.split(',', 1))     # splitto la stringa passata da javascript

        endp, c1 = itemgetter(0, 1)(endp.split(',', 1))

        c1, c2 = itemgetter(0, 1)(c1.split(',', 1))
        c2, c3 = itemgetter(0, 1)(c2.split(',', 1))

        p1 = "https://www.europeandataportal.eu/sparql"
        p2 = "https://io.datascience-paris-saclay.fr/sparql"
        p3 = "http://data.europa.eu/euodp/sparqlep"


        print(endp)
        endp = correct_url(endp)
        print(endp)

        with open('fileMail', 'w') as fo:                                               # redirigo l'output di downloadDataset in un file
            with redirect_stdout(fo):                                                   # il cui contenuto finirà nella mail da mandare (rendere più chiaro il contenuto)
                if endp != "":
                    dd(endp)
                if c1 == "1":
                    dp(p1)
                if c2 == "1":
                    dp(p2)
                if c3 == "1":
                    dp(p3)

        with open('fileMail', 'r') as file:
            data = file.read()

        trash, printline = itemgetter(0, 1)(data.split('-----', 1))

        print("sending the email...")

        port = 587  # For starttls
        smtp_server = "smtp.gmail.com"
        sender_email = "email-address"
        receiver_email = mail
        password = "password"
        msg = MIMEMultipart('alternative')

        if endp != "":
            msg["Subject"] = "H-BOLD: Extraction result"
            msg["To"] = receiver_email
            msg["From"] = sender_email
            msg.attach(MIMEText("Extraction of the dataset at the link " + endp + ".\n" + printline, 'plain'))
        #    message = """\Subject: Extraction\n\nExtraction of the dataset at the link """ + endp + """.\n""" + printline
        #else:
        #    message = """\Subject: Extraction\n\n""" + printline


        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_server, port) as server:
            server.ehlo()  # Can be omitted
            server.starttls(context=context)
            server.ehlo()  # Can be omitted
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())

        print("Mail sent successfully to " + receiver_email)


# classe associata all'url ./getDataSS/id, crea lo Schema Summary del dataset selezionato
# utilizza la collection ike del mongoDB
# chunk si ottiene dalla funzione createSS che si trova a riga 330 circa
class DataHandlerSS(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, endpoint_id):
        db = self.settings['db']
        db.lodex.ike.find_one({'_id': int(endpoint_id)}, callback=self._on_response)


    def _on_response(self, response, error):
        ss = response['ss']                         # ss ora contiene il JSON con attributes,nodes,edges,... del campo ss nel MongoDB del dataset corrispondente
                                                    # (come viene costruito il JSON? con la query? metodo response? response è una stringa?)

        ss.update({'name': response['name'], 'id': response['_id'], 'uri': response['uri']})          # viene aggiunto nome,id,uri IN CODA al JSON del dataset
        chunk = ppc.createSS(ss)
        self.write(chunk)
        self.finish()


#classe associata all'url /getDataCS
# con la nuova versione il CS lo ottengo leggendo direttamente i dati da MongoDB
class DataHandlerCS(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, endpoint_id):
        db = self.settings['db']
        db.lodex.ike.find_one({'_id': int(endpoint_id)}, callback=self._on_response)

    def _on_response(self, response, error):
        cs = response['cs']
        cs.update({'title': response['name'], 'id': response['_id'], 'uri': response['uri']})
        #chunk = createSS(ss, isCluster=True)                   istruzione dal vecchio codice
        self.write(cs)
        self.finish()


if __name__ == "__main__":
    db = motor.MotorClient()
    #db2 = motor.MotorClient().lodex

    # seguono i diversi indirizzi a cui si attacca application
    application = tornado.web.Application(handlers=[
        (r"/hbold_bootstrap/?", redirecter),
        (r"/lodex2?/?", redirecter),
        (r"/hbold", redirecter),
        (r"/hbold/", MainHandlerOk),
        (r"/hbold/index", IndexDatasetHandler),
        (r"/hbold/indexComplete", IndexDatasetHandlerFull),
        (r'/hbold/bower_components/(.*)', tornado.web.StaticFileHandler, {'path': './bower_components'}),
        (r'/bower_components/(.*)', tornado.web.StaticFileHandler, {'path': './bower_components'}),
        (r'/elements/(.*)', tornado.web.StaticFileHandler, {'path': './elements'}),
        (r'/hbold/elements/(.*)', tornado.web.StaticFileHandler, {'path': './elements'}),
        (r'/src/(.*)', tornado.web.StaticFileHandler, {'path': './src'}),
        (r'/hbold/src/(.*)', tornado.web.StaticFileHandler, {'path': './src'}),
        #(r'/js/(.*)', tornado.web.StaticFileHandler, {'path': './js'}),
        (r'/hbold/js/(.*)', tornado.web.StaticFileHandler, {'path': './js'}),
        (r'/hbold/css/(.*)', tornado.web.StaticFileHandler, {'path': './css'}),
        (r"/hbold/([0-9]+)", GraphHandler),    #non funziona, sembra ci siano problemi su LODeX.html (riga 362, su "each data")
        (r"/hbold/getDataSS/([0-9]+)", DataHandlerSS),
        (r"/hbold/getDataCS/([0-9]+)", DataHandlerCS),
        (r"/hbold/about", About),
        (r"/hbold/ss/([0-9]+)",SchemaSummary),
        (r"/hbold/sshier/([0-9]+)",HiericalSS),
        (r"/hbold/treecs/([0-9]+)",TreemapCS),
        (r"/hbold/suncs/([0-9]+)",SunburstCS),
        (r"/hbold/packcs/([0-9]+)",CirclePackCS),
        (r"/hbold/cs/([0-9]+)",ClusterSchema),
        (r"/hbold/exploreSS/([0-9]+)",ExploreSS),
        (r"/hbold/insertDataset/", InsertDataset),                            # parte nuova
        (r"/hbold/inserting/([^ ]*)", Inserting),                             # parte nuova
        (r"/hbold/proxy/(.*)$", proxy),
      #  (r"/lodex2/query", QueryDataHandler)
    ],
        static_path=os.path.join(os.path.dirname(__file__), "static"), template_path=os.path.join(os.path.dirname(__file__), "templates"), db=db, autoreload=True, debug=True)
    # seguono le operazioni per lanciare HBOLD su un browser
    port = 8891
    print('Listening on http://localhost:', port)
    application.listen(port)
    tornado.ioloop.IOLoop.instance().start()
