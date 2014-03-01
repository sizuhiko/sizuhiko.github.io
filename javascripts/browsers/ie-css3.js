function ie_css3(){var body=document.body,els=body.getElementsByTagName('*');function addClass(el,newClassName){el.className=el.className?el.className+' '+newClassName:el.className=newClassName;}
var spEls=[],listEls=[],i=els.length,classNo,n;while(i--){if(classNo=els[i].className.match(/(^|\s+)sp(\d)(\s+|$)/)){n=classNo[2];if(!spEls[n]){spEls[n]=[];}
spEls[n].push(els[i]);}
if(els[i].tagName=='UL'||els[i].tagName=='OL'){listEls.push(els[i]);}
if(els[i].className.match(/(^|\s+)button(\s+|$)/)){els[i].innerHTML='<span class="ie-button">'+els[i].innerHTML+'</span>';}}
var i=spEls.length,items=[];while(i--){if(spEls[i]){var j=spEls[i].length;while(j--){items[j]=spEls[i][j].childNodes;var h=0,len=items[j].length;while(h<len){els=items[j];addClass(els[h],'nth-child_'+i+'n1');h=h+i;}}}}
var i=listEls.length;while(i--){var lis=listEls[i].childNodes;if(lis.length>0){var firstLi=lis[0],lastLi=lis[lis.length-1];addClass(firstLi,'first-child');addClass(lastLi,'last-child');}}}
ie_css3();
