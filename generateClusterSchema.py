# file da lanciare per inserire i cluster schema nel campo ike di MongoDB
# guardare PostProcesingClusteredV4 per la costruzione del Cluster Schema

import sys
import pymongo as pm
import extractor.PostProcesingClusteredV3 as pp
#import extractor.PostProcesingClusteredV4 as pp

dbLodex= pm.MongoClient().lodex

def generateCSforAllEnd():
    ids = set([a['id'] for a in dbLodex.runInfo.find()])
    print(len(ids))

    for id in ids:
        pp.postProcForIdCluster(id)


def generateCSforEnd(id):
    pp.postProcForIdCluster(id)


def generateCS(argv):
    if 'all' == argv:
        generateCSforAllEnd()
    elif isinstance(int(argv), int):
        generateCSforEnd(int(argv))
    else:
        print("Bad input for the generation of cluster schema... a number or the string 'all' is required as input")


if __name__ == "__main__":
    generateCS(sys.argv[1:])
