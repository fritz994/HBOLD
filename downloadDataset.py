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


def downloadDataset(argv):
    if argv[0] in ["https://www.europeandataportal.eu/sparql", "https://io.datascience-paris-saclay.fr/sparql", "http://data.europa.eu/euodp/sparqlep"]:
        sparql = SPARQLWrapper(argv[0])
        q = util.queryGenerator.QueryGenerator()
        if argv[0] == "https://www.europeandataportal.eu/sparql":
            sparql.setQuery(q.EuDownload().query)
        elif argv[0] == "https://io.datascience-paris-saclay.fr/sparql":
            sparql.setQuery(q.dataScienceParisDownload().query)
        elif argv[0] == "http://data.europa.eu/euodp/sparqlep":
            sparql.setQuery(q.dataEuDownload().query)
        sparql.setReturnFormat(XML)

        """print(sparql)"""
        #print("Extraction endpoints")
        results = sparql.queryAndConvert()
        #print("Parsing results\n")
        #pprint(results)
        #pprint(se.parseResponseForDatasetExtr(None, results, "test_connection", False))
        #print("-----")

        if se.parseResponseForDatasetExtr(None, results, "test_connection", False):
            endArr = []
            endDIct = {}

            cont = 0
            for end in se.parseResponseForDatasetExtr(None, results, "test_connection", False):                    # end <C3><A8> un oggetto con 'dataset', 'title' e 'url' dell'endpoint
                end["url"] = end["url"].split("?")[0]
                if 'title' in end:
                    if end['url'] in endDIct:
                        tmp=endDIct[end['url']]
                        tmp['name'].append(end['title'])
                        endDIct[end['url']] = tmp
                    else:
                        endDIct[end['url']] = {'name':[end['title']]}
                cont += 1
            datasets = []
            urls = []
            count = mongo.getLastIdEndpointsLodex()
            copy = False

            for key in endDIct:
                endpoint = mongo.getAllEndopoinLodex()
                for e in endpoint:
                    if e["url"] == key:
                        copy = True

                if copy == False:
                    ds = {}
                    ds = {'url': key, '_id': count, 'name': endDIct[key]['name'][0]}
                    urls.append(key)
                    count = count+1
                    ds['datasets'] = [{'name':endDIct[key]['name'][0]}]
                    datasets.append(ds)

                copy = False

            # Stringa per il parsing
            print("Ricerca di nuovi dataset sul portale " + argv[0])
            print(cont)
            print("Trovati "+str(len(datasets))+" nuovi datasets")
            print(datasets)
            return
            if len(datasets) > 0:
                mongo.inserLodexDatasets(datasets)
                for i in range(0, len(datasets)):
                    url = urls[i]
                    automaticExtraction([url])

    else:

        url = argv[0]
        sparql = SPARQLWrapper(url)
        q = util.queryGenerator.QueryGenerator()
        id = mongo.startTestNew(url)
        print(id)

        """in runInfo, id <C3><A8> il numero dentro a ObjectId"""
        copy = False
        count = mongo.getLastIdEndpointsLodex()
        datasets = []

        if se.testConnection(url, q, sparql, id):
            endpoint = mongo.getAllEndopoinLodex()
            for e in endpoint:
                if e["url"] == url:
                    copy = True

            if copy == False:
                ds = {}
                trash, name = itemgetter(0, 1)(url.split('//', 1))
                ds = {'url': url, '_id': count, 'name': name}
                datasets.append(ds)
            else:
                print("-----")
                print(url + " is a valid endpoint but it is already present on our server.")
                print("The extraction has not been performed.")

        else:
            print("-----")
            print(url + " it is not a valid endpoint or it is not reachable at the moment. Retry later.")
            print("Extraction failed.")

        if len(datasets) > 0:
            mongo.inserLodexDatasets(datasets)
            mongo.deleteExtById(count)
            print(datasets)
            automaticExtraction([argv[0]])
            print("-----")
            print(url + " is a valid endpoint and it is not present on our server.")
            print("Extraction ended correctly.")

def main(argv):
    for portal in ["https://www.europeandataportal.eu/sparql", "https://io.datascience-paris-saclay.fr/sparql", "http://data.europa.eu/euodp/sparqlep"]:
        print(portal)
        downloadDataset([portal])

if __name__ == "__main__":
    main(sys.argv[1:])