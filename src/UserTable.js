import React, { createRef } from 'react'
import Select from 'react-select'
import _ from 'lodash'
import Datasheet from 'react-datasheet'
import axios from "axios";
import { Button, Card, CardContent, makeStyles, Modal } from '@material-ui/core';
import { Redirect } from 'react-router';
import Alert from '@material-ui/lab/Alert';

export default class ComponentSheet extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            grocery: {},
            items: 30,
            openModal: false,
            cacheProducts: [],
            products: [],
            currentProducts: [],
            selectProduct: 0,
            grid: [],
            loggedOut: false
        };

        this.selectAddPrRef = createRef();
    };

    selectUnit = (units, index) => {
        return (
            <Select
                autofocus
                openOnFocus
                defaultValue={units.length ? { label: units[0].unit, value: units[0].id } : {}}
                options={units.map(item => {
                    return { label: item.unit, value: item.id }
                })}
                onChange={({label, value}) => {
                    if (index < 2)
                        index = index + 2;
                    let grid = this.state.grid;
                    const unit = units.filter(x => x.id == value)[0];
                    grid[index][2].value = unit ? unit.ShortName : label;
                    grid[index][2].unit_id = value;
                }}
            />
        )
    }

    handleOpen = () => {
        this.setState({ openModal: true });
    };

    handleClose = () => {
        this.setState({ openModal: false });
    };

    loadData = async () => {
        const token = JSON.parse(localStorage.getItem('token'));
        const { data } = await axios.get('http://23.100.51.147:1337/providers', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });
        const result = data.filter(x => x.user && x.user === token.user.id)
        let filteredProducts = [];
        for (let i = 0; i < result.length; i++) {
            filteredProducts = filteredProducts.concat(result[i].products)
        }
        filteredProducts = filteredProducts.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
        this.setState({ cacheProducts: result, products: filteredProducts })
    }

    async componentDidMount() {
        await this.loadData();
        this.generateGrid()
    }

    removeItem(id) {
        this.setState({ currentProducts: this.state.currentProducts.filter(x => x.id != id) }, () => {
            let grid = this.state.grid;
            grid = grid.filter(x => x[0] && x[0].id && x[0].id != id);
            this.setState({ grid })
        })
    }

    // Продукт | Кількість | Одиниця Виміру |

    generateGrid() {
        const groceryValue = (id) => {
            if (this.state.grocery[id]) {
                const { label, value } = this.state.grocery[id]
                return `${label} (${value})`
            } else {
                return ''
            }
        }
       

        let rows = [
            [{ readOnly: true, colSpan: 4, value: 'Список замовлень', id: -999 }],
            [
                { readOnly: true, value: 'Продукт', id: -999 },
                { readOnly: true, value: "Кількість" },
                { readOnly: true, value: "Одиниця виміру" },
                { readOnly: true, value: "Дія" },
            ]
        ]

        for (let i = 0; i < this.state.currentProducts.length; i++) {
            const item = this.state.currentProducts[i];
            rows = rows.concat([[
                { readOnly: true, value: item.ProductName, id: item.id },
                {},
                { value: "", forceComponent: true, component: this.selectUnit(item.metric_units, i) },
                { forceComponent: true, component: (<Button color="secondary" onClick={() => { this.removeItem(item.id) }} >Видалити</Button>) }
            ]])
        }
        this.setState({ grid: rows }, () => {
            console.log(this.state.grid)
        })
    }

    appendProduct = () => {
        const productsSelected = this.selectAddPrRef.current.select.getValue();
        if (productsSelected.length) {
            const productId = productsSelected[0].value;
            const filtered = this.state.products.filter(x => x.id == productId);
            if (filtered.length && !this.state.currentProducts.filter(x => x.id == productId).length) {
                this.setState({ currentProducts: this.state.currentProducts.concat(filtered), openModal: false }, () => {
                    let grid = this.state.grid;
                    const item = this.state.currentProducts[ this.state.currentProducts.length - 1 ];
                    grid.push([
                        { readOnly: true, value: item.ProductName, id: item.id },
                        {},
                        { value: item.metric_units.length ? item.metric_units[0].unit : "", forceComponent: true, component: this.selectUnit(item.metric_units, this.state.grid.length) },
                        { forceComponent: true, component: (<Button color="secondary" onClick={() => { this.removeItem(item.id) }} >Видалити</Button>) }
                    ])
                    this.setState({ grid: grid })
                })
            }
        }
    }

    onCellsChanged = changes => {
        const grid = this.state.grid;
        changes.forEach(({ cell, row, col, value }) => {
            grid[row][col] = { ...grid[row][col], value };
        });
        this.setState({ grid }, () => {
            console.log(this.state.grid)
        });
    };

    logOut = () => {
        let answer = window.confirm("Бажаєте вийти?")
        if (answer) {
            delete localStorage.token;
            this.setState({ loggedOut: true })
        }
    }

    sendData = async () => {
        let answer = window.confirm("Перевірили данні?")
        const token = JSON.parse(localStorage.token);
        if (answer)
        {
            let outputData = [];
            const grid = this.state.grid;
            grid.forEach((row, idx) => {
                if (idx < 2)
                    return;

                let dataObject = {
                    product_id: row[0].id,
                    count: row[1].value,
                    unit: row[2].value
                }
                outputData.push(dataObject);
            })
            if (outputData.length) {
                try {
                    const { data } = await axios.post(
                        'http://23.100.51.147:1337/orders',
                        {
                          date: new Date(),
                          user: token.user.id,
                          data: outputData
                        },
                        {
                          headers: {
                            Authorization:
                              'Bearer ' + token.jwt,
                          },
                        }
                      );
                  
                    console.log(data);
                    window.location.reload();
                } catch (err) {
                    console.log(err);
                }
            }
        }
    }

    render() {
        if (this.state.loggedOut)
            return <Redirect to="/login"/>
        return (
            <div id="bkg" style={styles.root}>
                { !this.state.products.length ? (<Alert severity="info">Зачейкайте, будь ласка! Завантаження...</Alert>) :
                    (<div>
                        <div style={styles.row}>
                            <Button onClick={this.handleOpen} variant="contained" color="primary" style={{ marginBottom: 10 }} >Додати</Button>
                            <Button onClick={this.sendData} variant="contained" color="primary" style={{ marginBottom: 10 }} >Відправити</Button>
                            <Button onClick={this.logOut} variant="contained" color="secondary" style={{ marginBottom: 10 }} >Вийти</Button>
                        </div>
                        <Modal
                            open={this.state.openModal}
                            onClose={this.handleClose}
                            aria-labelledby="simple-modal-title"
                            aria-describedby="simple-modal-description">
                            <Card style={{ width: 300, height: "100vh" }}>
                                {this.state.products.filter(x => !this.state.currentProducts.filter(y => y.id == x.id).length).length ? (
                                    <CardContent>
                                        <p>Оберіть продукт та нажміть на кнопку "Готово"</p>
                                        <Select
                                            autofocus
                                            openOnFocus
                                            options={this.state.products.filter(x => !this.state.currentProducts.filter(y => y.id == x.id).length).map((item) => {
                                                return { label: item.ProductName, value: item.id }
                                            })}
                                            ref={this.selectAddPrRef}
                                        />
                                        <Button onClick={this.appendProduct} style={{ marginTop: 20 }} variant="text">Готово</Button>
                                    </CardContent>) :
                                    (<CardContent>
                                        <p>В списку більше нема продуктів</p>
                                    </CardContent>)}
                            </Card>
                        </Modal>
                        <div style={styles.tableContainer}>
                            <Datasheet
                                data={this.state.grid}
                                valueRenderer={(cell) => cell.value}
                                onCellsChanged={this.onCellsChanged}
                                onChange={() => { }}
                            /></div>
                    </div>)}
            </div>
        )
    }
}

const styles = {
    root: {
        height: '100vh',
        backgroundImage: 'url(https://source.unsplash.com/random)',
        backgroundRepeat: 'no-repeat',
        // backgroundColor:
        //   theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: "flex",
        justifyContent: 'center',
        alignItems: 'center'
    },
    tableContainer: {
        width: "80vw",
        backgroundColor: "white",
        borderRadius: "10px",
        maxHeight: "85vh",
        minHeight: '40vh',
        overflowY: "scroll",
        boxShadow: "4px 4px 8px 0px rgba(34, 60, 80, 0.3)"
    },
    card: {

    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
}