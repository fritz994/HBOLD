# file che contiene l'algoritmo della costruzione (createCS) e inserimento (postProcForId) del Cluster Schema
# spostare la cartella igraph in un'altra directory
# il cluster schema viene creato se è già presente uno Schema Summary funzionante nel dataset

import sys
sys.path.append('extractor')
import util.mongo as mongo
import traceback
from itertools import chain, combinations
# import networkx as nx
import pymongo as pm
import time
import pprint
import motor
from operator import itemgetter
import igraph


def powerset_generator_fr(i):
    for subset in chain.from_iterable(combinations(i, r) for r in range(len(i)+1)):
        yield frozenset(subset)

client = pm.MongoClient()
dbEnd=client.RDFstruct
dbLodex=client.lodex



rdfTypest="http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
virt="http://www.openlinksw.com/schemas/virtrdf"
owl="http://www.w3.org/2002/07/owl"
rdfs="http://www.w3.org/2000/01/rdf-schema"

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


def createCS(ss, isCluster=False):
    node = []
    invNode = {}
    index = 0
    vocab = set('/'.join(a['p'].rsplit('/')[:-1]) for a in
                ss['attributes'])  # vocab è l'insieme degli http da cui si prendono i dati
    attributes = {}
    for att in ss['attributes']:
        #             vocab.add('/'.join(att['p'].rsplit('/')[:-1])
        if att['c'] not in attributes:
            attributes[att['c']] = [{'n': int(att['n']), 'p': att['p']}]
        else:
            attributes[att['c']].append({'n': int(att['n']), 'p': att[
                'p']})  # attributes è un JSON formato dalle classi, e per ogni classe sono riportati gli attributi (campo p nel MongoDB)

    for clas in ss['nodes']:
        vocab.add(extractVocab(clas['c']))  # extrVocab e extrValue sono funzioni definite sopra
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
        invNode[clas['c']] = index  # invNode è un vettore che "numera" le classi nel dataset
        index += 1

    # pprint.pprint(invNode)

    edges = []  # qui inizia la parte di creazione degli archi
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

    if (not isCluster):
        chunk = {'nodes': node, 'links': edges, 'classes': None, 'classeslinks': None, 'vocab': list(vocab),
                 'title': ss['name'], 'id': ss['id'], 'uri': ss['uri']}
    else:
        '''
        initializing graph with nodes
        '''
        g = igraph.Graph(len(node))

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
                source = node[e['source']]
                target = node[e['target']]
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
            source = node[e['source']]
            target = node[e['target']]
            if source['community'] != target['community']:
                linksCommunity.append(
                    {'source': source['community'], 'target': target['community']})

        """
        parameters on MongoDB
        """
        chunk = {'nodes': communities, 'links': linksCommunity, 'classes': node, 'classeslinks': edges,
                 'vocab': list(vocab)}

    return chunk



def postProcForId(idEnd):

    if dbLodex.ike.find({'_id': idEnd}).count() > 0:
        dataset = dbLodex.ike.find_one({'_id': idEnd})
      #  print(dataset)
        ss = {'nodes': dataset['ss']['nodes'], 'edges': dataset['ss']['edges'], 'attributes': dataset['ss']['attributes'],'ingoing': dataset['ss']['ingoing'],'outgoing': dataset['ss']['outgoing'], 'name': dataset['name'], 'id': dataset['_id'], 'uri':dataset['uri'] }

        # creo il CS
        try:
            chunk = createCS(ss,isCluster=True)
        except:
            print("errore in dataset " + str(idEnd) +  " poichè lo Schema Summary è vuoto")     # per i dataset con id 175,360,394,433 e in generale senza lo SS
            chunk = None

        # inserisco il CS nel MongoDB
        try:
            dbLodex.ike.update({'_id': idEnd}, {'$set': {'cs': chunk}})
            print("inserito cluster schema per il dataset " + str(idEnd))
        except:
            print("errore nell'inserimento per il dataset " + str(idEnd))
