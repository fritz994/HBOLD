     function submitForm(){
        document.forms["myForm"].submit();
        var email = document.getElementById("email").value;
        var end = document.getElementById("endpoint").value;

        var c1 = 0, c2 = 0, c3 = 0, c4 = 0;

        var check1=$('#check1').prop('checked');
        if(check1==true)
            c1++;

        var check2=$('#check2').prop('checked');
        if(check2==true)
            c2++;

        var check3=$('#check3').prop('checked');
        if(check3==true)
            c3++;

        c4 = c1+c2+c3;

        if(!(email === "" || end === "") || !(email === "" || c4==0) ){
            window.location="/hbold/inserting/" + email + "," + end + "," + c1 + "," + c2 + "," + c3;
		    alert("ATTENZIONE. In alcuni casi, l'operazione di estrazione dei dati potrebbe richiedere qualche minuto.");
		}

		else if(email === "")  {alert("errore nell'inserimento della mail");}
		else if(end === "" && c4==0) {alert("Nessun endpoint inserito e nessuna operazione di refresh selezionata");}

     }
