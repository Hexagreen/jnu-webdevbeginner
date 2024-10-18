console.log(document.getElementById('plant1'));
dragElement(document.getElementById('plant1'));
dragElement(document.getElementById('plant2'));
dragElement(document.getElementById('plant3'));
dragElement(document.getElementById('plant4'));
dragElement(document.getElementById('plant5'));
dragElement(document.getElementById('plant6'));
dragElement(document.getElementById('plant7'));
dragElement(document.getElementById('plant8'));
dragElement(document.getElementById('plant9'));
dragElement(document.getElementById('plant10'));
dragElement(document.getElementById('plant11'));
dragElement(document.getElementById('plant12'));
dragElement(document.getElementById('plant13'));
dragElement(document.getElementById('plant14'));

    function dragElement(terrariumElement) {
        let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
        terrariumElement.onpointerdown = pointerDrag;
        terrariumElement.ondblclick = elementDoubleClick;

        function pointerDrag(e) {
            e.preventDefault();
            console.log(e);
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onpointermove = elementDrag;
            document.onpointerup = stopElementDrag;
        }
    
        function elementDrag(e) {
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            console.log(pos1, pos2, pos3, pos4);
            terrariumElement.style.top = terrariumElement.offsetTop - pos2 + 'px';
            terrariumElement.style.left = terrariumElement.offsetLeft - pos1 + 'px';
        }

        function stopElementDrag() {
            document.onpointerup = null;
            document.onpointermove = null;
        }
        
        function elementDoubleClick(e) {
            e.preventDefault();
            let plants = document.getElementsByClassName('plant');
            let maxZidx = 2;
            for(let i = 0; i < plants.length; i++) {
                curZidx = plants[i].style.zIndex;
                maxZidx = curZidx > maxZidx ? curZidx : maxZidx;
            }
            terrariumElement.style.zIndex = maxZidx + 1;
        }
   }

    
   
