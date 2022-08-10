class mother {
    name: string;
    atk: number;
    def: number;
    hp: number;
    constructor(name:string, atk:number, def:number, hp:number) {
        this.name = name
        this.atk = atk;
        this.def=def;
        this.hp= hp;
    }
    
    Attack(target:mother) {
        this.Print()
        target.Print()
        target.hp-=this.atk
        target.Print()
        this.Print()
    }
    Print() {
        console.log(`Имя: ${this.name} Атака: ${this.atk} Защита: ${this.def} Здоровье: ${this.hp}`)
    }
}

const player = new mother("Игрок", 10, '3фввв', 20)
const npc = new mother("npc", 7, 4, 15)
player.Attack(npc)