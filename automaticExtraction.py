import sys
import time
import datetime
import threading
import extractor.SchemaExtractorTestV3 as se

from generateSchemaSummary import generateSS
from generateClusterSchema import generateCS
from extractor.util import mongo

threads = []

"""Extract schema viene chiamato se l'endpoint <C3><A8> vuoto o non aggiornato """
def threadProcess(endId):
    end = mongo.getByIdLodex(endId)
    thread = threading.Thread(target=se.ExtractSchema, args=(end, False))
    thread.start()

    threads.append(thread)

    while len(threads) > 10:
        time.sleep(1)
        for t in threads:
            if not t.isAlive():
                print("Thread " + t.getName() + " terminated")
                threads.remove(t)


def endpointExtraction(id):
    p = mongo.getExtById(id)

    """per ogni endpoint controllo se l'estrazione degli indici (e quindi anche la generazione delle istanze della
       collection 'ext') e' stata compiuta correttamente o no. In caso negativo procedo con un nuovo tentativo di
       estrarre gli indici"""
    if len(p) == 0:
        threadProcess(id)
    else:
        e = mongo.getLastRunById(id)
        print(e)
        if 'date' not in e or (datetime.datetime.now()-e['date']).days >= 2:
            threadProcess(id)

    for t in threads:
        print ("Thread " + t.getName() + " terminated")
        t.join()  # Wait until thread terminates its task


def automaticExtraction(argv):
    print(argv)
    if(argv == 'all'):
        for end in mongo.getAllEndopoinLodex():
            print(f"Index extraction for {end['url']}")
            endpointExtraction(end['_id'])
            print(f"Generating schema summary for {end['url']}")
            generateSS(end['_id'])
            print(f"Generating cluster schema for {end['url']}")
            generateCS(end['_id'])

    elif isinstance(argv, str):
        url = argv
        end = mongo.getEndopointByUrl(url)
        if end is None:
            print(f"No endpoint found in the database. Consider uploading {url} through the addManuallyDataset utils")
            return

        p = mongo.getExtById(end['_id'])

        print(f"Index extraction for {url}")
        endpointExtraction(end['_id'])
        print(f"Generating schema summary for {url}")
        generateSS(end['_id'])
        print(f"Generating cluster schema for {url}")
        generateCS(end['_id'])
    else:
        print("Something awful happened")



def main(argv):
    print(argv)
    if len(argv)==0:
        print("all")
        automaticExtraction("all")
    else:
        for el in argv:
            print(el)
            automaticExtraction(el)

if __name__ == "__main__":
    main(sys.argv[1:])
