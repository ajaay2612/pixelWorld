let SelectedColor = $state({ color: '#000000', opacity: 1 })

export function setColor(color, opacity){
    SelectedColor = {
        color,
        opacity
    }
}

export function getColor(){
    return SelectedColor
}