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
import SchemaExtractorTestV3

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
        ip = self.request.remote_ip
        now = time.time()
        to_return = "OK"
		
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


class proxy(tornado.web.RequestHandler):
    @check_ip
    @gen.coroutine
    def get(self, url):
        #url tagliato dopo il carattere ? quindi lo prendo da request
        url = self.request.uri[1:]
        print(url)

        if not (url.startswith("http://") or url.startswith("https://")):
            if url.startswith("http"):
                url = url.replace("http:/","http://")
            elif url.startswith("https"):
                url = url.replace("https:/","https://")
			
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
        with open('LODeX.html', 'r') as file:
            self.write(file.read())

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
class TreemapCS(tornado.web.RequestHandler):
    def get(self,endpoint_id):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        print('Creato SS con id ',endpoint_id)
        self.render('treemap.html')


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
class About(tornado.web.RequestHandler):
    def get(self):
        self.set_header('Content-Type', '') # I have to set this header 
        #https://stackoverflow.com/questions/17284286/disable-template-processing-in-tornadoweb
        #https://github.com/tornadoweb/tornado/blob/master/tornado/template.py
        self.render('about.html')
        #self.render('about.html')

# associata a ./index
class IndexDatasetHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        exid = [a['_id'] for a in exclusion]
        # pprint.pprint(exid)
        db = self.settings['db']
        cursor = db.lodex.ike.find({'ss': {'$exists': True}, '_id': {'$nin': exid}
                                    })
        res = []
        while (yield cursor.fetch_next):
            tmp = cursor.next_object()
            res.append({'id': tmp['_id'], 'name': tmp['name'] if 'name' in tmp else None,
                        'uri': tmp['uri'], 'triples': tmp['triples'] if 'triples' in tmp else None,
                        'instances': tmp['instances'] if 'instances' in tmp else None,
                        'propCount': len(tmp['propList']) if 'propList' in tmp else None,
                        'classesCount': len(tmp['classes']) if 'classes' in tmp else None})
        self.content_type = 'application/json'
        print('Pagina Home con', len(res) , 'dataset')                      # stampa sul prompt il numero dei dataset trovati
        self.write({'data': res})            # scrive su ./index il JSON dei dataset trovati
                                             # cambiando res non funziona più nulla ----> legame tra index e la home?
        self.finish()
 
 
#associata a ./indexComplete
class IndexDatasetHandlerFull(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    @gen.coroutine
    def get(self):
        exid = [a['_id'] for a in exclusion]
        #         pprint.pprint(exid)
        db = self.settings['db']  #
        cursor = db.lodex.ike.find({'ss': {'$exists': True}, '_id': {'$nin': exid}
                                    })
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
        print(len(res))
        self.finish()
 
 
class GraphHandler(tornado.web.RequestHandler):
    def get(self, endpoint_id):
        self.render('insertDataset.html')


# parte nuova
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

        with open('fileMail', 'w') as fo:                                               # redirigo l'output di downloadDataset in un file
            with redirect_stdout(fo):                                                   # il cui contenuto finirà nella mail da mandare (rendere più chiaro il contenuto)
                if endp != "":
                    dd([endp])
                if c1 == "1":
                    dd([p1])
                if c2 == "1":
                    dd([p2])
                if c3 == "1":
                    dd([p3])
 
        with open('fileMail', 'r') as file:
            data = file.read()
 
        trash, printline = itemgetter(0, 1)(data.split('-----', 1))

        print("inviando la mail...")
 
        port = 587  # For starttls
        smtp_server = "smtp.gmail.com"
        sender_email = "hboldprova2@gmail.com"
        receiver_email = mail
        password = "123.stella"
        msg = MIMEMultipart('alternative')
		
        if endp != "":
            msg["Subject"] = "H-BOLD: Extraction result"
            msg["To"] = receiver_email
            msg["From"] = sender_email
            msg.attach(MIMEText("Extraction of the dataset at the link " + endp + ".\n" + printline, 'plain'))
            #message = """\Subject: Extraction\n\nExtraction of the dataset at the link """ + endp + """.\n""" + printline
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
        db.lodex.ike.find_one({'_id': int(endpoint_id)},
                              callback=self._on_response)
 
 
    def _on_response(self, response, error):
        ss = response['ss']                         # ss ora contiene il JSON con attributes,nodes,edges,... del campo ss nel MongoDB del dataset corrispondente
                                                    # (come viene costruito il JSON? con la query? metodo response? response è una stringa?)
 
        ss.update(
            {'name': response['name'], 'id': response['_id'], 'uri': response['uri']})          # viene aggiunto nome,id,uri IN CODA al JSON del dataset
        chunk = createSS(ss)
        self.write(chunk)
        self.finish()
 
 
#classe associata all'url /getDataCS
# con la nuova versione il CS lo ottengo leggendo direttamente i dati da MongoDB
class DataHandlerCS(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, endpoint_id):
        db = self.settings['db']
        db.lodex.ike.find_one({'_id': int(endpoint_id)},
                              callback=self._on_response)
 
    def _on_response(self, response, error):
        cs = response['cs']
        cs.update(
            {'title': response['name'], 'id': response['_id'], 'uri': response['uri']})
        #chunk = createSS(ss, isCluster=True)                   istruzione dal vecchio codice
        self.write(cs)
        self.finish()
 
 

# sembra che il software funzioni lo stesso senza IntensionalDataHandler
class IntensionalDataHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self, s):
 
        id = self.get_argument("id", None)
 
        db.lodex.ike.find_one({'_id': int(id)}, callback=self._on_response)
 
    def _on_response(self, response, error):
 
        if error:
            raise tornado.web.HTTPError(500)
        obj = []
        tmp = {}
        tmp['s'] = self.get_argument("s", None)
        tmp['p'] = self.get_argument("p", None)
        tmp['o'] = self.get_argument("o", None)
        trovato = False
        step = 0
        ik = []
        if 'ik' in response:
            for i in response['ik']:
                # print extrValue(i['s'])
                if extrValue(i['s']) == tmp['s']:
                    trovato = True
                    tmp['ss'] = i['s']
                    ik.append(i)
                if extrValue(i['s']) == tmp['p']:
                    trovato = True
                    tmp['pp'] = i['s']
                    ik.append(i)
                if extrValue(i['s']) == tmp['o']:
                    trovato = True
                    tmp['oo'] = i['s']
                    ik.append(i)
        obj.append(tmp)
        node = []
        invNode = {}
        index = 0
        vocab = set()
        nodes = set()
        pprint.pprint(ik)
        for a in ik:
            nodes.add(a['s'])
            nodes.add(a['o'])
 
        for clas in nodes:
            vocab.add(extractVocab(clas))
            node.append({'name': extrValue(clas), 'fullname': clas,
                         'vocab': extractVocab(clas)})
            invNode[clas] = index
            index += 1
 
        edges = []
        #         pprint.pprint(response["properties"])
        for prop in ik:
            if prop['s'] in invNode and prop['o'] in invNode:
                aggiunto = False
                for e in range(len(edges)):
                    if edges[e]['source'] == invNode[prop['s']] and edges[e]['target'] == invNode[prop['o']]:
                        edges[e]['label'].append({
                            'name': extrValue(prop['p']),
                            'vocab': extractVocab(prop['p'])})
                        aggiunto = True
                if not aggiunto:
                    edges.append({'source': invNode[prop['s']],
                                  'target': invNode[prop['o']],
                                  'label': [{
                                      'name': extrValue(prop['p']),
                                      'vocab': extractVocab(prop['p'])}]})
 
                    #         pprint.pprint({'nodes':node,'links':edges})
                    #
                    #         pprint.pprint(vocab)
                    #
        print('lodex2')
        self.write(
            {'nodes': node, 'links': edges, 'vocab': list(vocab), 'title': response['name'], 'id': response['_id']})
        self.finish()
 
 
def extractVocab(uri):
    if len(uri.rsplit('/')[-1].split(':')) > 1:
        return ':'.join(uri.rsplit(':')[:-1])
    elif len(uri.rsplit('/')[-1].split('#')) > 1:
        return '#'.join(uri.rsplit('#')[:-1])
    else:
        return '/'.join(uri.rsplit('/')[:-1])
 
 
def extrValue(uri):
    if len(uri.rsplit('/')[-1].split(':')) > 1:
        return uri.rsplit(':')[-1]
    elif len(uri.rsplit('/')[-1].split('#')) > 1:
        return uri.rsplit('#')[-1]
    else:
        return uri.rsplit('/')[-1]
 
# funzione che costruisce lo SS al momento della pressione di uno dei pulsanti
def createSS(ss, isCluster=False):
    node = []
    invNode = {}
    index = 0
    vocab = set('/'.join(a['p'].rsplit('/')[:-1]) for a in ss['attributes'])            #vocab è l'insieme degli http da cui si prendono i dati
    attributes = {}
 
    for att in ss['attributes']:
        #             vocab.add('/'.join(att['p'].rsplit('/')[:-1])
        if att['c'] not in attributes:
            attributes[att['c']] = [{'n': int(att['n']), 'p': att['p']}]
        else:
            attributes[att['c']].append({'n': int(att['n']), 'p': att['p']})            # attributes è un JSON formato dalle classi, e per ogni classe sono riportati gli attributi (campo p nel MongoDB)
 
    for clas in ss['nodes']:
        vocab.add(extractVocab(clas['c']))                                              # extrVocab e extrValue sono funzioni definite sopra
        att = []
        if clas['c'] in attributes:
            att = [{'p': extrValue(a['p']),
                    'n': float("{0:.2f}".format(float(float(a['n']) / float(clas['n'])))) if a['n'] > 0 else 0,
                    'vocab': extractVocab(a['p']), 'fullName': a['p']} for a in
                   sorted(attributes[clas['c']], key=itemgetter('n'), reverse=True)]
 
        currentNode = {'name': extrValue(clas['c']), 'ni': int(clas['n']), 'vocab': extractVocab(clas['c']),
                       'att': att, 'fullName': clas['c']}
 
 
        """custer = []
        if 'cluster' in clas:
            for cl in clas['cluster']:
                currentClust = {'n': cl['n']}
                currentClust['cluster'] = [{'vocab': extractVocab(c), 'uri': c, 'name': extrValue(c)} for c in
                                           cl['cluster']]
                custer.append(currentClust)
        if len(custer) > 0:
            currentNode['cluster'] = custer"""
 
        node.append(currentNode)
        invNode[clas['c']] = index                                      # invNode è un vettore che "numera" le classi nel dataset
        index += 1
 
    # pprint.pprint(invNode)
 
    edges = []                                                          # qui inizia la parte di creazione degli archi
     #         pprint.pprint(response["properties"])
    for prop in ss['edges']:
        if prop['s'] in invNode and prop['o'] in invNode:
            aggiunto = False
            for e in range(len(edges)):
                if edges[e]['source'] == invNode[prop['s']] and edges[e]['target'] == invNode[prop['o']]:
                    edges[e]['label'].append({'np': int(prop['n']),
                                              'name': extrValue(prop['p']),
                                              'vocab': extractVocab(prop['p']),
                                              'fullName': prop['p']})
                    aggiunto = True
            if not aggiunto:
                edges.append({'source': invNode[prop['s']],
                              'target': invNode[prop['o']],
                              'label': [{'np': int(prop['n']),
                                         'name': extrValue(prop['p']),
                                         'vocab': extractVocab(prop['p']),
                                         'fullName': prop['p']}]})
 
    for i in range(len(edges)):
        edges[i]['label'] = sorted(edges[i]['label'], key=itemgetter('np'))
 
 
    if(not isCluster):
        chunk = {'nodes': node, 'links': edges, 'classes': None, 'classeslinks': None, 'vocab': list(vocab),
                 'title': ss['name'], 'id': ss['id'], 'uri': ss['uri']}
    else:
        '''
        initializing graph with nodes
        '''  
        g = Graph(len(node))
 
        '''
        add edges to the graph
        '''
        for e in edges:
            for i in range(len(e['label'])):
                g.add_edge(e['source'], e['target'])
 
 
 
        '''
        generate communities
        '''
        multi = g.community_multilevel()
        communities = []
        numCommunity = max(multi.membership) + 1
         
        '''
        assign each node to own community
        '''
        for i in range(numCommunity):
            nodesCom = []
            classesCom = []
            for n in range(len(node)):
                if multi.membership[n] == i:
                    node[n]['community'] = i
                    node[n]['id'] = n
                    nodesCom.append(node[n])
                    classesCom.append(node[n]['name'])
 
            currentCommunity = {'name': "", 'ni': len(nodesCom), 'vocab': "",
                                'nodes': nodesCom, 'fullName': "", 'classes': classesCom}
            communities.append(currentCommunity)
         
        """
        add edges within every community
        """
        for i in range(numCommunity):
            edgesCom = []
            for e in edges:
                source= node[e['source']]
                target= node[e['target']]
                if source['community'] == target['community'] == i:
                    edgesCom.append(
                        {'source': e['source'], 'target': e['target']})
            communities[i]['edges'] = edgesCom
 
        degreeNodes = [0] * len(node)
         
        """
        find the node with the higher degree which names own community
        """
        for c in communities:
            maxCount = -1
            nodeMax = None
            for e in c['edges']:                    
                if e['source'] != e['target']:
                    degreeNodes[e['source']] += 1
                    degreeNodes[e['target']] += 1
            for n in c['nodes']:
                if degreeNodes[n['id']] > maxCount:
                    maxCount = degreeNodes[n['id']]
                    nodeMax = n['id']
            c['name'] = node[nodeMax]['name']
            c['fullName'] = node[nodeMax]['name']
 
        linksCommunity = []
 
        """
        find edges between communities
        """
        for e in edges:
            source= node[e['source']]
            target= node[e['target']]
            if source['community'] != target['community']:
                linksCommunity.append(
                    {'source': source['community'], 'target': target['community']})
                    
        """
        pass parameters to html
        """       
        chunk = {'nodes': communities, 'links': linksCommunity, 'classes': node, 'classeslinks': edges,
                 'vocab': list(vocab), 'title': ss['name'], 'id': ss['id'], 'uri': ss['uri']}

    return chunk





if __name__ == "__main__":
    db = motor.MotorClient()
    db2 = motor.MotorClient().lodex

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
        (r"/(.*)$", proxy),
      #  (r"/lodex2/query", QueryDataHandler)
    ],
        static_path=os.path.join(os.path.dirname(__file__), "static"), db=db, autoreload=True, debug=True)
    # seguono le operazioni per lanciare HBOLD su un browser
    port = 8891
    print('Listening on http://localhost:', port)
    application.listen(port)
    tornado.ioloop.IOLoop.instance().start()
