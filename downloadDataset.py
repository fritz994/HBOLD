import sys
sys.path.append(r"extractor")

import extractor.SchemaExtractorTestV3 as se
from automaticExtraction import automaticExtraction

from pprint import pprint
from extractor import util
from operator import itemgetter
from SPARQLWrapper import SPARQLWrapper, XML
from extractor.util import mongo, queryGenerator
from xml.dom.minidom import parseString

def downloadPortal(argv):
    print(argv)
    sparql = SPARQLWrapper(argv)
    q = util.queryGenerator.QueryGenerator()
    if argv == "https://www.europeandataportal.eu/sparql":
        sparql.setQuery(q.EuDownload().query)
    elif argv == "https://io.datascience-paris-saclay.fr/sparql":
        sparql.setQuery(q.dataScienceParisDownload().query)
    elif argv == "http://data.europa.eu/euodp/sparqlep":
        sparql.setQuery(q.dataEuDownload().query)
    else:
        sparql.setQuery(q.dataEuDownload().query)

    sparql.setReturnFormat(XML)

    results = sparql.queryAndConvert()
    parsed = se.parseResponseForDatasetExtr(None, results, "test_connection", False)

    #è brutto lasciare un if aperto fino alla fine della funzione
    #aggiungere un controllo per uscire quando parsed è vuoto. c'è da capire cosa ritorna parsed e come capire quando si può considerare vuoto
    if not parsed:
        print(f"Nothing found at {argv}. Is the url correct?")
        return

    endDIct = {}

    cont = 0
    for end in parsed:
        end["url"] = end["url"].split("?")[0]
        if 'title' in end:
            if end['url'] in endDIct:
                tmp = endDIct[end['url']]
                tmp['name'].append(end['title'])
                endDIct[end['url']] = tmp
            else:
                endDIct[end['url']] = {'name':[end['title']]}
        else:
            endDIct[end['url']] = {'name':[end['url']]}
        cont += 1

    datasets = []
    urls = []

    # beware that count contains the last id found in mongodb + 1
    count = mongo.getLastIdEndpointsLodex()
    copy = False

    for key in endDIct:
        endpoint = mongo.getAllEndopoinLodex()
        for e in endpoint:
            if e["url"] == key:
                copy = True
                break

        if not copy:
           ds = {}
           ds = {'url': key, '_id': count, 'name': endDIct[key]['name'][0]}
           urls.append(key)
           count = count+1
           #  ds['datasets'] = [{'name':endDIct[key]['name'][0]}]    --  OLD and I think not correct -- Federico
           ds['datasets'] = endDIct[key]['name']
           datasets.append(ds)

           copy = False

    # Stringa per il parsing
    print(f"La ricerca di nuovi dataset sul portale {argv} ha trovato {cont} risultati")
    print(f"Sono stati trovati {str(len(datasets))} nuovi datasets")
    print(datasets)
    print(urls)

    if len(datasets) > 0:
        mongo.inserLodexDatasets(datasets)
        for i in range(0, len(datasets)):
            url = urls[i]
            automaticExtraction([url])


def downloadDataset(url):
    print(url)
    sparql = SPARQLWrapper(url)
    q = util.queryGenerator.QueryGenerator()
    id = mongo.startTestNew(url)
    print(id)

    # in runInfo, id <C3><A8> il numero dentro a ObjectId
    copy = False
    count = mongo.getLastIdEndpointsLodex()
    datasets = []
    name = ""

    if se.testConnection(url, q, sparql, id):
        endpoint = mongo.getAllEndopoinLodex()
        for e in endpoint:
            if e["url"] == url:
                name = e["name"]
                copy = True
                break

        if copy == False:
            ds = {}
            ds = {'url': url, '_id': count, 'name': url}
            datasets.append(ds)
        else:
            print("-----")
            print(url + " is a valid endpoint but it is already present on our server with the following name: " + name)
            print("The extraction has not been performed.")

    else:
        print("-----")
        print(url + " it is not a valid endpoint or it is not reachable at the moment. Retry later.")
        print("Extraction failed.")

    if len(datasets) > 0:
        mongo.inserLodexDatasets(datasets)
        #penso che questo comando sia inutile, lo commento -- Federico
        #mongo.deleteExtById(count)
        print(datasets)
        automaticExtraction(url)
        print("-----")
        print(url + " is a valid endpoint and it is not present on our server.")
        print("Extraction ended correctly.")


def main(argv):
    for portal in ["https://trafair.eu/sparql", "https://www.europeandataportal.eu/sparql", "https://io.datascience-paris-saclay.fr/sparql", "http://data.europa.eu/euodp/sparqlep"]:
        print(portal)
        downloadPortal(portal)

if __name__ == "__main__":
    main(sys.argv[1:])
