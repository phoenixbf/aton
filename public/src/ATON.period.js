
export default class Period {
    constructor(id){
        if (id !== undefined){
            ATON.periods[id] = this;
            this.id = id;
            }

        // Range (init unbounded)
        this.min = undefined;
        this.max = undefined;
    }

    setMin(f){
        if (this.max !== undefined && f !== undefined && f >= this.max) return this; // invalid min
        this.min = f;

        return this;
    }
    setMax(f){
        if (this.min !== undefined && f !== undefined && f <= this.min) return this; // invalid max
        this.max = f;

        return this;
    }

}