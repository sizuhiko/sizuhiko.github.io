var spans=document.getElementById("main").getElementsByTagName("span");for(var i=0;i<spans.length;i++){if(spans[i].className=="imgright"||spans[i].className=="imgleft"){var imgs=spans[i].getElementsByTagName("img");for(var j=0;j<imgs.length;j++){if(imgs[j].width>260){imgs[j].width="260";}}}}
;
