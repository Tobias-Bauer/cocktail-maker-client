import React from 'react';
import './Home.scss'
import default_drink from '../assets/svg/default_drink.svg'
import settings from '../assets/svg/settings.svg'
import cocktail_settings from '../assets/svg/cocktail_settings.svg'
import add from '../assets/svg/add.svg'
import add_white from '../assets/svg/add-white.svg'
import pencil from '../assets/svg/pencil.svg'
import pump from '../assets/svg/pump.svg'
import peristaltic_pump from '../assets/svg/peristaltic_pump.svg'
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField'
import Slider from '@material-ui/core/Slider';

const lastUsedSizes = [100, 500, 1000, 700, 800]
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = { autocompleteEditValues: [null], autocompleteValues: [null], sliders: [100], cocktails: [], ingredients: [], pumpValues: [], cocktailSettings: false, mixing: false, modal: false, edit: false, add: false, settings: false, imgUrl: "", title: "", description: "", newIngredient: "", selected: 0, ml: 100 }
    }
    componentDidMount() {
        this.socket()
    }
    socket() {
        var ws = new WebSocket(this.props.wsDomain)
        ws.onmessage = evt => {
            try {
                var data = JSON.parse(evt.data)
                console.log(data)
                if (data.event === "cocktailList") {
                    this.setState({ cocktails: data.data })
                    for (var el of data.data) {
                        this.getB64Data(el.id)
                    }
                } else if (data.event === "ingredientList") {
                    this.setState({ ingredients: data.data })
                    this.setPumpValues(data.data)
                } else if (data.event === "msg") {
                    alert(data.data)
                }
            } catch (error) {
                console.log(error)
            }
        }
        ws.onclose = e => {
            console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
            setTimeout(() => {
                this.socket()
            }, 1000);
            ws.close()
        };
        this.connection = ws
    }
    componentWillUnmount() {
        this.connection.close()
    }
    mixButtonAction(index) {
        if (this.state.mixing) {
            alert("Already working on a drink!")
        } else {
            this.setState({ modal: true, selected: index })
        }
    }
    mixIt() {
        //Check for glass
        if (true) {
            alert("Place your glass!")
        }
    }
    async titleChange(index, id, description) {
        if (this.state.edit) {
            var res = await window.prompt("Change the title", this.state.cocktails[index].title)
            if (res) {
                this.connection.send(JSON.stringify({ event: "changeText", description: description, title: res, id: id }))
            }
        }
    }
    async descriptionChange(index, id, title) {
        if (this.state.edit) {
            var res = await window.prompt("Change the description", this.state.cocktails[index].description)
            if (res) {
                this.connection.send(JSON.stringify({ event: "changeText", description: res, title: title, id: id }))
            }
        }
    }
    async imgChange(index, id) {
        if (this.state.edit) {
            var res = await window.prompt("Change the image url", this.state.cocktails[index].imgUrl)
            if (res) {
                this.connection.send(JSON.stringify({ event: "changeImg", img: res, id: id }))
            }
        }
    }
    close(set) {
        return (
            <svg className="close" onClick={() => this.setState(set)} xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 39 39" > <rect width="5" height="50" y="3.536" fill="black" rx="2.5" transform="rotate(-45 0 3.536)" ></rect> <rect width="5" height="50" x="35.355" fill="black" rx="2.5" transform="rotate(45 35.355 0)" ></rect> </svg>
        )
    }
    submitNewCocktail() {
        var arr = []
        var completed = true
        for (var i in this.state.autocompleteValues) {
            if (this.state.autocompleteValues[i] === null) {
                alert("Can't add undefined ingredient!")
                completed = false
                break
            } else {
                arr[i] = { ingredient: this.state.autocompleteValues[i].ingredient, value: this.state.sliders[i] }
            }
        }
        console.log(arr)
        if (completed) {
            this.connection.send(JSON.stringify({ event: "submitNewCocktail", title: this.state.title, description: this.state.description, img: this.state.imgUrl, ingredients: arr }))
            this.setState({ add: false })
        }
    }
    removeCocktail(id) {
        this.connection.send(JSON.stringify({ event: "removeCocktail", id: id }))
    }
    async getB64Data(id) {
        console.log("Getting data")
        fetch(this.props.domain + '/getCocktailCover/' + id, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        })
            .then(res => res.json())
            .then(
                (result) => {
                    document.getElementById("img-" + id).src = "data:image;base64," + result
                },
                (error) => {
                    console.log(error)
                }
            )

        return null
    }
    addNewIngredient() {
        this.connection.send(JSON.stringify({ event: "submitNewIngredient", ingredient: this.state.newIngredient }))
    }
    setPumpValues(list) {
        var arr = ["", "", "", "", "", ""]
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < 6; j++) {
                if (list[i].pump === j + 1) {
                    arr[j] = list[i].ingredient
                    this.setState({ pumpValues: arr })
                }
            }
        }
    }
    setPump(pump, newValue) {
        if (newValue) {
            this.connection.send(JSON.stringify({ event: "setPump", pump: pump, ingredient: newValue }))
        } else {
            //remove Pump from DB
        }
    }
    input(n) {
        var sliders = this.state.sliders
        const sum = sliders.reduce((sum, val) => sum + val, 0)
        const diff = sum - 100
        let remainder = 0
        for (let i in sliders) {
            if (i !== n) { //don't modify the slider which is being dragged
                let val = sliders[i] - diff / (sliders.length - 1)
                if (val < 0) {
                    remainder += val
                    val = 0
                }
                sliders[i] = val
            }
        }
        if (remainder) {
            const filteredLength = sliders.filter((val, key) => val > 0 && key !== n).length
            for (let i in sliders) {
                if (i !== n && sliders[i] > 0) {
                    sliders[i] = sliders[i] + remainder / filteredLength
                }
            }
        }
        this.setState({ sliders })
    }
    setSlider(value, index) {
        if (value !== this.state.sliders[index]) {
            var temp = this.state.sliders
            temp[index] = value
            this.setState({ sliders: temp })
            this.input(index)
        }
    }
    addIngredientToDrink() {
        var temp = this.state.sliders
        temp.push(0)
        var temp2 = this.state.autocompleteValues
        temp2.push(null)
        this.setState({ sliders: temp })
    }
    round(index) {
        return Math.round(this.state.sliders[index]);
    }
    setDrinkIngredient(value, index) {
        var temp = this.state.autocompleteValues
        temp[index] = value
        this.setState({ autocompleteValues: temp })
    }
    render() {
        var defaultColor = "rgb(238, 238, 238)"
        var selectedColor = "rgb(195, 236, 195)"
        return (
            <div className="home">
                <div onClick={() => this.setState({ settings: !this.state.settings })} style={{ backgroundColor: this.state.settings ? selectedColor : defaultColor }} className="action settings">
                    <img src={settings} alt="settings" />
                </div>
                <div onClick={() => this.setState({ add: !this.state.add })} style={{ backgroundColor: this.state.add ? selectedColor : defaultColor }} className="action add">
                    <img src={add} alt="addCocktail" />
                </div>
                <div onClick={() => this.setState({ edit: !this.state.edit })} style={{ backgroundColor: this.state.edit ? selectedColor : defaultColor }} className="action edit">
                    <img src={pencil} alt="edit" />
                </div>


                <div className="cocktailGrid">
                    {this.state.cocktails.map((el, index) => {
                        return (
                            <div key={index} className="cocktailCard">
                                {this.state.edit ? <div className="removeCocktailCard" onClick={() => this.removeCocktail(el.id)}>
                                    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><title>Remove</title><path fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='32' d='M400 256H112' /></svg>
                                </div> : null}
                                {this.state.edit ? <img onClick={() => this.setState({ cocktailSettings: true, currentCocktail: index })} className="cocktailSettings" src={cocktail_settings} alt="cocktail_settings" /> : null}
                                <img id={"img-" + el.id} onClick={() => this.imgChange(index, el.id)} src="https://i.stack.imgur.com/y9DpT.jpg" alt="CocktailImg" />
                                <h3 onClick={() => this.titleChange(index, el.id, el.description)}>{el.title}</h3>
                                <p onClick={() => this.descriptionChange(index, el.id, el.title)}>{el.description}</p>
                                {!this.state.edit ? <div onClick={() => this.mixButtonAction(index)} style={{ backgroundColor: this.state.mixing ? "grey" : "rgb(55, 179, 55)" }}>Mix</div> : null}
                            </div>
                        )
                    })}
                </div>



                {this.state.cocktailSettings ?
                    <div className="modal cocktailSettingsModal">
                        {this.close({ settings: false })}
                        {this.state.sliders.map((el, index) => {
                            return (
                                <div key={index} className="drinkSettings">
                                    <Autocomplete
                                        value={this.state.autocompleteEditValues[index]}
                                        onChange={(e, value) => this.setDrinkIngredient(value, index)}
                                        options={this.state.ingredients}
                                        getOptionLabel={option => option.ingredient}
                                        style={{ width: this.state.sliders.length === 1 ? "100%" : "30%" }}
                                        renderInput={(params) => <TextField {...params} label="Ingredient 1" variant="outlined" />}
                                    />
                                </div>
                            )
                        })}
                    </div> : null}



                {this.state.add ?
                    <div className="modal addModal">
                        <img onClick={() => this.submitNewCocktail()} className="submitNewCocktail" src={add_white} alt="addCocktail" />
                        <h1>Add a Cocktail</h1>
                        {this.close({ add: false })}
                        <h3>Enter an image url:</h3>
                        <input value={this.state.imgUrl} onChange={e => this.setState({ imgUrl: e.target.value })} type="text"></input>
                        <h3>Enter a title:</h3>
                        <input value={this.state.title} onChange={e => this.setState({ title: e.target.value })} type="text"></input>
                        <h3>Add ingredients:</h3>
                        {this.state.sliders.map((el, index) => {
                            return (
                                <div key={index} className="drinkSettings">
                                    <Autocomplete
                                        value={this.state.autocompleteValues[index]}
                                        onChange={(e, value) => this.setDrinkIngredient(value, index)}
                                        options={this.state.ingredients}
                                        getOptionLabel={option => option.ingredient}
                                        style={{ width: this.state.sliders.length === 1 ? "100%" : "30%" }}
                                        renderInput={(params) => <TextField {...params} label="Ingredient 1" variant="outlined" />}
                                    />
                                    {this.state.sliders.length === 1 ? null : <Slider
                                        value={this.state.sliders[index]}
                                        onChange={(e, value) => this.setSlider(value, index)}
                                        aria-labelledby="discrete-slider"
                                        valueLabelFormat={() => this.round(index)}
                                        valueLabelDisplay="auto"
                                        step={1}
                                        min={0}
                                        max={100}
                                        style={{ width: "calc(70% - 40px)" }}
                                        marks={[{ value: 0, label: "0%" }, { value: 100, label: "100%" }]}
                                    />}
                                </div>
                            )
                        })}
                        {this.state.sliders.length > 5 ? null : <button onClick={() => this.addIngredientToDrink()}>Add</button>}
                        <h3>Write a story/description:</h3>
                        <textarea value={this.state.description} onChange={e => this.setState({ description: e.target.value })}></textarea>
                    </div> : null}


                {this.state.settings ?
                    <div className="modal settingsModal">
                        <h1>Settings</h1>
                        {this.close({ settings: false })}
                        <h3>Equipped Ingredients:</h3>
                        <div className="pumpGrid">
                            <div className="pump">
                                <h2>1</h2>
                                <img src={pump} alt="pump" />
                                <select value={this.state.pumpValues[0]} onChange={e => this.setPump(1, e.target.value)}>
                                    <option value={""}>Empty</option>
                                    {this.state.ingredients.map((el, index) => {
                                        return (
                                            <option key={el.id} value={el.ingredient}>{el.ingredient}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pump">
                                <h2>2</h2>
                                <img src={pump} alt="pump" />
                                <select value={this.state.pumpValues[1]} onChange={e => this.setPump(2, e.target.value)}>
                                    <option value={""}>Empty</option>
                                    {this.state.ingredients.map((el, index) => {
                                        return (
                                            <option key={el.id} value={el.ingredient}>{el.ingredient}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pump">
                                <h2>3</h2>
                                <img src={pump} alt="pump" />
                                <select value={this.state.pumpValues[2]} onChange={e => this.setPump(3, e.target.value)}>
                                    <option value={""}>Empty</option>
                                    {this.state.ingredients.map((el, index) => {
                                        return (
                                            <option key={el.id} value={el.ingredient}>{el.ingredient}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pump">
                                <h2>4</h2>
                                <img src={pump} alt="pump" />
                                <select value={this.state.pumpValues[3]} onChange={e => this.setPump(4, e.target.value)}>
                                    <option value={""}>Empty</option>
                                    {this.state.ingredients.map((el, index) => {
                                        return (
                                            <option key={el.id} value={el.ingredient}>{el.ingredient}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pump">
                                <h2>5</h2>
                                <img src={pump} alt="pump" />
                                <select value={this.state.pumpValues[4]} onChange={e => this.setPump(5, e.target.value)}>
                                    <option value={""}>Empty</option>
                                    {this.state.ingredients.map((el, index) => {
                                        return (
                                            <option key={el.id} value={el.ingredient}>{el.ingredient}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pump">
                                <h2>6</h2>
                                <img src={pump} alt="pump" />
                                <select value={this.state.pumpValues[5]} onChange={e => this.setPump(6, e.target.value)}>
                                    <option value={""}>Empty</option>
                                    {this.state.ingredients.map((el, index) => {
                                        return (
                                            <option key={el.id} value={el.ingredient}>{el.ingredient}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pump symbols">
                                <p>Air pump:</p>
                                <img src={pump} alt="pump" />
                                <p>Peristaltic pump:</p>
                                <img src={peristaltic_pump} alt="peristaltic_pump" />
                            </div>
                        </div>
                        <h3>Ingredients List:</h3>
                        <input onChange={e => this.setState({ newIngredient: e.target.value })} type="text"></input>
                        <button onClick={() => this.addNewIngredient()}>Add</button>
                        <ul>
                            {this.state.ingredients.map((el, index) => {
                                return (
                                    <li key={el.id}>{el.ingredient}</li>
                                )
                            })}
                        </ul>
                    </div> : null}



                {this.state.modal ?
                    <div className="modal drinkSize">
                        <h1>{this.state.cocktails[this.state.selected].title}</h1>
                        {this.close({ modal: false })}
                        {lastUsedSizes.length !== 0 ? <h3>Sizes used by others:</h3> : null}
                        <div className="othersSizes">
                            {lastUsedSizes.map((el, index) => {
                                return (
                                    <div onClick={() => this.mixIt()}>
                                        {// Add images for different sizes here
                                        }
                                        <p>{el} ml</p>
                                    </div>
                                )
                            })}
                        </div>
                        <h3>Custom size:</h3>
                        <div className="customSize">
                            <input type="range" min="100" max="1000" step="10" value={this.state.ml} onChange={e => this.setState({ ml: e.target.value })}></input>
                            <div onClick={() => this.mixIt()}>
                                <img src={default_drink} alt="default-drink" />
                                <p>{this.state.ml} ml</p>
                            </div>
                        </div>
                    </div> : null}
            </div>
        )
    }
}