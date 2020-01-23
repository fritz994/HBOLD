var csid = window.location.href.split('/').pop();

$.ajax({
    type: 'GET',
    url: '../getDataCS/' + csid,
    dataType: 'json',
    success: function (data) {
        $(".graph-title").text(data.title);
        $('#classes').append('<h2> Classes:</h2><br>');
        var flag = change(data);
        var width=970,
        heigth=750;
        var color = d3.scaleSequential([8, 0], d3.interpolateMagma);
        var svg = d3.select("#chart").append("svg") ,
            diameter = width,
            g = svg.append("g").attr("transform", "translate(2,2)"),
            format = d3.format(",d");
        var pack = d3.pack()
            .size([diameter - 4, diameter - 4]);

        var root = d3.hierarchy(flag)
            .sum(function (d) { return sumByCount(d); })
            .sort(function (a, b) { return b.value - a.value; });
            console.log(pack(root).descendants());
        var node = g.selectAll(".node")
            .data(pack(root).descendants())
            .enter().append("g")
            .on("click", function(n) {
                var j;
                n.children ? j = 0 : j = 1;
                console.log(n);
                if(j==1){
                i=0;
                //controlla che il nodo non sia già stato selezionato
                $('input:checkbox').each(function(){
               if($(this).attr('id')==n.data.fullname)
                 i=1;
                }); 
                if(i==0){
                  $('#classes').append('<div class="form-check">' +
                            '<input type="checkbox" heigth="30px" class="form-check-input" id="' + n.data.fullname+ '"checked>' +
                            '<label class="form-check-label" for="materialUnchecked">' + n.data.name + '</label>' +
                  '</div>');
                }
            }
            })
            .attr("class", function (d) { return d.children ? "node" : "leaf node"; })
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
        node.append("title")
            .text(function (d) { return d.data.name + "\n" + format(d.value); });

        node.append("circle")
            .attr("r", function (d) { return d.r; });

        node.filter(function (d) { return !d.children; }).append("text")
            .attr("dy", "0.3em")
            .text(function (d) { return d.data.name.substring(0, d.r / 3); });
            svg.attr("viewBox", autoBox);
    
            $('#goToSS').click(function () {
                var nodesSelected = new Object();
                var j = 0;
                var count = 0;
                $('input:checkbox').each(function () {
                    if ($(this).prop('checked') == true)
                        for (var i = 0; i < data.classes.length; i++) {
                            if ($(this).attr('id') == data.classes[i].fullName) {
                                count++;
                                nodesSelected[j] = data.classes[i];
                                j++;
                                break;
                            }
                        }
                });
                nodesSelected.length = j;
                if (count > 0) {
                    var stringaLink = new Object();
                    var stringaNodes = new Object();
                    stringaNodes.length = j;
                    $.ajax({
                        type: 'GET',
                        url: '../getDataCS/' + csid,
                        dataType: 'json',
                        success: function (data) {
                            /* data.classes.count;
                             data.classes.id;
                             for (var i=0;i<data.nodes.length;i++){
                                 data.classes[i].count=10;
                                 data.classes[i].id=i;
                             }*/
    
                            var z = 0;
                            for (var i = 0; i < data.classeslinks.length; i++) {
                                for (var j = 0; j < nodesSelected.length; j++) {
    
                                    if (data.classeslinks[i].source == nodesSelected[j].id || data.classeslinks[i].target == nodesSelected[j].id) {
    
                                        stringaLink[z] = data.classeslinks[i];
                                        z++;
                                        break;
    
                                    }
                                }
                            }
                            stringaLink.length = z;
                            console.log(z);
                            z = nodesSelected.length;
                            sessionStorage.clear();
    
                            sessionStorage.setItem('nodesSelected', JSON.stringify(nodesSelected));
                            stringaNodes = nodesSelected;
                            for (var i = 0; i < stringaLink.length; i++) {
                                for (var j = 0; j < data.classes.length; j++) {
                                    if (stringaLink[i].source == data.classes[j].id || stringaLink[i].target == data.classes[j].id) {
                                        var flag = 1;
                                        for (var x = 0; x < stringaNodes.length; x++) {
                                            if (stringaNodes[x].id == data.classes[j].id) {
                                                flag = 0;
                                            }
                                        }
                                        if (flag == 1) {
                                            stringaNodes[z] = data.classes[j];
                                            z++;
                                            stringaNodes.length++;
                                        }
                                    }
    
                                }
                            }
                            //stringaNodes corretto   
                            //   console.log(stringaLink);
                            // console.log(stringaNodes);
                            sessionStorage.setItem('links', JSON.stringify(stringaLink));
                            sessionStorage.setItem('nodes', JSON.stringify(stringaNodes));
                            window.location = "../exploreSS/" + csid;
                        }
                    }); // fine del metodo ajax
                }
            });



    
    
        }
});


function autoBox() {
    console.log(this);
    var { x, y, width, height } = this.getBBox();
    return [x, y, width, height];
}
function sumByCount(d) {

    return d.children ? 0 : 1;
}

function change(data) {
    var children = [];
    var nephew = [];
    for (var i = 0; i < data.nodes.length; i++) {
        nephew[i] = [];
        for (var j = 0; j < data.nodes[i].nodes.length; j++) {
            nephew[i][j] = {
                'name': data.nodes[i].nodes[j].name,
                'size': data.nodes[i].nodes[j].ni,
                'fullname': data.nodes[i].nodes[j].fullName,
                'vocab': data.nodes[i].nodes[j].vocab,
                'id': "root." + data.nodes[i].name + "." + data.nodes[i].nodes[j].name
            };
        }
        children[i] = data.nodes[i];
    }
    var flag = {
        'name': "root",
        'children': []
    }
    for (var j = 0; j < data.nodes.length; j++) {
        var child = {
            'name': "",
            'fullname': "",
            'vocab': getRandomColor(),
            'children': [],
            'id': ""
        };
        child['name'] = data.nodes[j].name;
        child['fullname'] = data.nodes[j].fullName;
        child['id'] = data.nodes[j].name;
        child['children'] = nephew[j];
        flag.children.push(child);

    }
    return flag;
}
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
$('#dataset-tab').click(function () {
    window.location = "../";
});
$("#graph-tab").click(function () {
    window.location.href = "../cs/" + csid;

});
$('#treemapCS').click(function () {
    window.location.href = "../treecs/" + csid;
});
$("#sunCS").click(function () {
    window.location.href = "../suncs/" + csid;

});


function openNav() {
    document.getElementById("myNav").style.width = "100%";
}

function closeNav() {
    document.getElementById("myNav").style.width = "0%";
}





