import sys
import pymongo as pm
import extractor.PostProcesingCulsteredV3 as pp
#import extractor.PostProcesingClusteredV4 as pp4


dbLodex = pm.MongoClient().lodex

def generateSSforAllEnd():
    ids=set([a['id'] for a in dbLodex.runInfo.find()])
    print(len(ids))

    for idEnd in ids:
        pp.postProcForId(idEnd)


def generateSchemas(argv):
    if argv == "all":
        ids = set([a['id'] for a in dbLodex.runInfo.find()])
        print(len(ids))

        for id in ids:
            pp.postProcForId(id)
            pp.postProcForIdCluster(id)
    else:
        pp.postProcForId(argv)
        pp.postProcForIdCluster(argv)


def generateSSforEndById(id):
    pp.postProcForId(id)


def generateSS(argv):
    if 'all' == argv[0]:
        generateSSforAllEnd()
    elif isinstance(argv[0], int):
        generateSSforEndById(int(argv[0]))
    else:
        print("Bad input for generation of the schema summary... a number or the string 'all' is required")


if __name__ == "__main__":
    print(sys.argv[1:])
    if len(sys.argv) == 2 and sys.argv[1] == "all":
        generateSchemas("all")
    elif all(isinstance(int(x), int) for x in sys.argv[1:]):
        for x in sys.argv[1:]:
            generateSchemas(int(x))
    else:
        print("Usage --> generateSchemaSummary.py \"all\" \n or generateSchemaSummary digit [other digits]")
        exit()


#if __name__ == "__main__":
#    generateSS(sys.argv[1:])
