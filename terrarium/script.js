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
        let startOffX = 0, startOffY = 0,
            currentX = 0, currentY = 0;
        terrariumElement.ondragstart = pointerDrag;
        terrariumElement.ondblclick = elementDoubleClick;

        function pointerDrag(e) {
            console.log(e);
            currentX = e.target.offsetLeft;
            currentY = e.target.offsetTop;
            startOffX = e.offsetX;
            startOffY = e.offsetY;
            terrariumElement.ondragend = stopElementDrag;
        }

        function stopElementDrag(e) {
            console.log(e);
            console.log(e.offsetX - startOffX, e.offsetY - startOffY, currentX, currentY)
            terrariumElement.style.top = currentY + e.offsetY - startOffY + 'px';
            terrariumElement.style.left = currentX + e.offsetX - startOffX + 'px';
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

    
   

