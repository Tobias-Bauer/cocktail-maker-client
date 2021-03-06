import React from 'react';
import './Home.scss'
import default_drink from '../assets/svg/default_drink.svg'
import settings from '../assets/svg/settings.svg'
import cocktail_settings from '../assets/svg/cocktail_settings.svg'
import add from '../assets/svg/add.svg'
import add_white from '../assets/svg/add-white.svg'
import pencil from '../assets/svg/pencil.svg'
import pump from '../assets/svg/pump.svg'
import placeholder from '../assets/img/placeholder.jpg'
import drink from '../assets/gif/drink.gif'
import submit from '../assets/svg/submit.svg'
import star from '../assets/svg/star-outline.svg'
import unStar from '../assets/svg/star.svg'
import peristaltic_pump from '../assets/svg/peristaltic_pump.svg'
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField'

const lastUsedSizes = [100, 500, 1000, 700, 800]
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = { readyState: true, editPercentages: [], autocompleteValuesEdit: [], autocompleteValues: [null], percentages: [100], cocktails: [], ingredients: [], pumpValues: [], cocktailSettings: false, mixing: false, modal: false, edit: false, add: false, settings: false, imgUrl: "", title: "", description: "", newIngredient: "", selected: 0, ml: 100 }
    }
    componentDidMount() {
        this.socket()

    }
    componentWillUnmount() {
        this.connection.close()
    }
    async socket() {
        var ws = new WebSocket(this.props.wsDomain)
        ws.onopen = evt => {
            this.setState({ readyState: true })
        }
        ws.onmessage = async evt => {
            try {
                var data = JSON.parse(evt.data)
                console.log(data)
                if (data.event === "cocktailList") {
                    var cocktails = this.orderCocktails(data.data)
                    this.setState({ cocktails }, () => {
                        for (var el of cocktails) {
                            var img = document.getElementById("img-" + el.id)
                            document.getElementById("img-" + el.id).src = placeholder
                            this.getB64Data(img, el.id)

                        }
                    })
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
            if (this.state.readyState) {
                this.setState({ readyState: false })
            }
            setTimeout(() => {
                this.socket()
            }, 1000);
            ws.close()
        };
        this.connection = ws
    }
    orderCocktails(data) {
        //Order the array to have favorites and currently possible drinks at the top
        var possibleFavorite = []
        var possible = []
        var notPossibleFavorite = []
        var notPossible = []
        //function to sort
        for (var el of data) {
            if (el.missing === 0) {
                if (el.favorite) {
                    possibleFavorite.push(el)
                } else {
                    possible.push(el)
                }
            } else {
                if (el.favorite) {
                    notPossibleFavorite.push(el)
                } else {
                    notPossible.push(el)
                }
            }
        }
        return (possibleFavorite.concat(possible.concat(notPossibleFavorite.concat(notPossible))))
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
                arr[i] = { ingredient: this.state.autocompleteValues[i].ingredient, value: this.state.percentages[i] }
            }
        }
        console.log(arr)
        if (completed) {
            this.connection.send(JSON.stringify({ event: "submitNewCocktail", title: this.state.title, description: this.state.description, img: this.state.imgUrl, ingredients: arr }))
            this.setState({ add: false, title: "", description: "", img: "", autocompleteValues: [], percentages: [100] })
        }
    }
    removeCocktail(id) {
        this.connection.send(JSON.stringify({ event: "removeCocktail", id: id }))
    }
    async getB64Data(img, id) {
        console.log("Getting image: " + id)
        fetch(this.props.domain + '/getCocktailCover/' + id, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        })
            .then(res => res.json())
            .then(
                (result) => {
                    if (result) {
                        console.log(img)
                        img.src = "data:image;base64," + result
                    }
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
                }
            }
        }
        this.setState({ pumpValues: arr })
    }
    setPump(pump, newValue) {
        if (newValue) {
            this.connection.send(JSON.stringify({ event: "setPump", pump: pump, ingredient: newValue }))
        } else {
            //remove Pump from DB
            this.connection.send(JSON.stringify({ event: "removePump", pump: pump }))
        }
    }
    setPercentage(value, index) {
        var temp = this.state.percentages
        temp[index] = isNaN(value) ? "NaN" : value
        this.setState({ percentages: temp })
    }
    addIngredientToDrink() {
        var temp = this.state.percentages
        temp.push(0)
        var temp2 = this.state.autocompleteValues
        temp2.push(null)
        this.setState({ percentages: temp, autocompleteValues: temp2 })
    }
    setDrinkIngredient(value, index) {
        var temp = this.state.autocompleteValues
        temp[index] = value
        this.setState({ autocompleteValues: temp })
    }
    setPercentageEdit(value, index) {
        var temp = this.state.editPercentages
        temp[index] = isNaN(value) ? "NaN" : value
        this.setState({ editPercentages: temp })
    }
    addIngredientToDrinkEdit() {
        var temp = this.state.editPercentages
        temp.push(0)
        var temp2 = this.state.autocompleteValuesEdit
        temp2.push(null)
        this.setState({ editPercentages: temp, autocompleteValuesEdit: temp2 })
    }
    setDrinkIngredientEdit(value, index) {
        var temp = this.state.autocompleteValuesEdit
        temp[index] = value
        this.setState({ autocompleteValuesEdit: temp })
    }
    loadCocktailSettings(index, id) {
        var ingredients = this.state.cocktails[index].ingredients
        var values = []
        var ingredientList = []
        for (var i in ingredients) {
            ingredientList.push(ingredients[i].ingredient)
            values.push(ingredients[i].value)
        }
        var ingredientNames = ingredientList.slice(0)
        this.setState({ cocktailSettings: true, editPercentages: values, autocompleteValuesEdit: ingredientList, ingredientNames, currentEdit: id })
    }
    removeIngredientEdit(index) {
        var editPercentages = this.state.editPercentages
        var autocompleteValuesEdit = this.state.autocompleteValuesEdit
        editPercentages.splice(index, 1)
        autocompleteValuesEdit.splice(index, 1)
        this.setState({ editPercentages, autocompleteValuesEdit })
    }
    removeIngredient(index) {
        var percentages = this.state.percentages
        var autocompleteValues = this.state.autocompleteValues
        percentages.splice(index, 1)
        autocompleteValues.splice(index, 1)
        this.setState({ percentages, autocompleteValues })
    }
    submitIngredients() {
        var arr = []
        var completed = true
        for (var i in this.state.autocompleteValuesEdit) {
            if (this.state.autocompleteValuesEdit[i] === null) {
                alert("Can't add undefined ingredient!")
                completed = false
                break
            } else {
                arr[i] = { ingredient: this.state.autocompleteValuesEdit[i], value: this.state.editPercentages[i] }
            }
        }
        if (completed) {
            this.connection.send(JSON.stringify({ event: "updateCocktailIngredients", id: this.state.currentEdit, ingredients: arr }))
        }
    }
    favorite(id) {
        this.connection.send(JSON.stringify({ event: "favorite", id }))
    }
    unfavorite(id) {
        this.connection.send(JSON.stringify({ event: "unfavorite", id }))
    }
    render() {
        var defaultColor = "rgb(238, 238, 238)"
        var selectedColor = "rgb(195, 236, 195)"
        return (
            <div className="home">
                {!this.state.readyState ? <div className="connecting">
                    <img src={drink} />
                    <p>Connecting...</p>
                </div> : null}
                <button onClick={() => this.connection.send(JSON.stringify({ event: "submitNewCocktail" }))}>Send trash data</button>


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
                                {this.state.edit ? <img onClick={() => this.loadCocktailSettings(index, el.id)} className="cocktailSettings" src={cocktail_settings} alt="cocktail_settings" /> : null}
                                <img id={"img-" + el.id} onClick={() => this.imgChange(index, el.id)} src={placeholder} alt="CocktailImg" />
                                <div className="star">
                                    {el.favorite ? <img src={unStar} alt="unStar" onClick={() => this.unfavorite(el.id)} /> : <img src={star} alt="star" onClick={() => this.favorite(el.id)} />}
                                </div>
                                <p className="missingCount">{el.missing === 0 ? "✅" : el.missing}</p>
                                <h3 onClick={() => this.titleChange(index, el.id, el.description)}>{el.title}</h3>
                                <p onClick={() => this.descriptionChange(index, el.id, el.title)}>{el.description}</p>
                                {!this.state.edit ? <div onClick={() => this.mixButtonAction(index)} style={{ backgroundColor: this.state.mixing ? "grey" : "rgb(55, 179, 55)" }}>Mix</div> : null}
                            </div>
                        )
                    })}
                </div>



                {this.state.cocktailSettings ?
                    <div className="modal cocktailSettingsModal">
                        <h1>Edit Cocktail Ingredients</h1>
                        {this.close({ cocktailSettings: false })}
                        {this.state.editPercentages.map((el, index) => {
                            return (
                                <div key={index} className="drinkSettings">
                                    <Autocomplete
                                        value={this.state.autocompleteValuesEdit[index]}
                                        onChange={(e, value) => this.setDrinkIngredientEdit(value, index)}
                                        options={this.state.ingredientNames}
                                        getOptionLabel={option => option}
                                        style={{ width: this.state.editPercentages.length === 1 ? "100%" : "calc(100% - 120px)" }}
                                        renderInput={(params) => <TextField {...params} label={"Ingredient " + (index + 1)} variant="outlined" />}
                                    />
                                    {this.state.editPercentages.length === 1 ? null : <input value={this.state.editPercentages[index]}
                                        onChange={e => this.setPercentageEdit(e.target.valueAsNumber, index)} type="number" />}
                                    {this.state.editPercentages.length > 1 ? <div className="removeIngredient" onClick={() => this.removeIngredientEdit(index)}>
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><title>Remove</title><path fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='32' d='M400 256H112' /></svg>
                                    </div> : null}
                                </div>
                            )
                        })}
                        <p style={{ color: Math.round(this.state.editPercentages.reduce((sum, val) => sum + val, 0)) === 100 ? "rgb(58, 187, 32)" : "red" }}>{Math.round(this.state.editPercentages.reduce((sum, val) => sum + val, 0)) === 100 ? "100%" : "100% ≠ " + Math.round(this.state.editPercentages.reduce((sum, val) => sum + val, 0)) + "%"}</p>
                        {this.state.editPercentages.length > 5 ? null : <button className="addIngredientButton" onClick={() => this.addIngredientToDrinkEdit()}>Add</button>}
                        <img onClick={() => this.submitIngredients()} className="submitIngredients" src={submit} alt="submitIngredients" />
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
                        {this.state.percentages.map((el, index) => {
                            return (
                                <div key={index} className="drinkSettings">
                                    <Autocomplete
                                        value={this.state.autocompleteValues[index]}
                                        onChange={(e, value) => this.setDrinkIngredient(value, index)}
                                        options={this.state.ingredients}
                                        getOptionLabel={option => option.ingredient}
                                        style={{ width: this.state.percentages.length === 1 ? "100%" : "calc(100% - 120px)" }}
                                        renderInput={(params) => <TextField {...params} label={"Ingredient " + (index + 1)} variant="outlined" />}
                                    />
                                    {this.state.percentages.length === 1 ? null : <input value={this.state.percentages[index]}
                                        onChange={e => this.setPercentage(e.target.valueAsNumber, index)} type="number" />}
                                    {this.state.percentages.length > 1 ? <div className="removeIngredient" onClick={() => this.removeIngredient(index)}>
                                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><title>Remove</title><path fill='none' stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='32' d='M400 256H112' /></svg>
                                    </div> : null}
                                </div>
                            )
                        })}
                        <p style={{ color: Math.round(this.state.percentages.reduce((sum, val) => sum + val, 0)) === 100 ? "rgb(58, 187, 32)" : "red" }}>{Math.round(this.state.percentages.reduce((sum, val) => sum + val, 0)) === 100 ? "100%" : "100% ≠ " + Math.round(this.state.percentages.reduce((sum, val) => sum + val, 0)) + "%"}</p>
                        {this.state.percentages.length > 5 ? null : <button className="addIngredientButton" onClick={() => this.addIngredientToDrink()}>Add</button>}
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