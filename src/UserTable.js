import React, { createRef } from 'react'
import Select from 'react-select'
import _ from 'lodash'
import Datasheet from 'react-datasheet'
import axios from "axios";
import { Button, Card, CardContent, makeStyles, Modal } from '@material-ui/core';

export default class ComponentSheet extends React.Component {
  constructor (props) {
    super(props)
    this.options = [
      { label: 'Bread', value: 2.35 },
      { label: 'Berries', value: 3.05 },
      { label: 'Milk', value: 3.99 },
      { label: 'Apples', value: 4.35 },
      { label: 'Chicken', value: 9.95 },
      { label: 'Yoghurt', value: 4.65 },
      { label: 'Onions', value: 3.45 },
      { label: 'Salad', value: 1.55 }
    ]
    this.state = {
      grocery: {},
      items: 30,
      openModal: false,
      cacheProducts: [],
      products: [],
      currentProducts: [],
      selectProduct: 0
    };

    this.selectAddPrRef = createRef();
  };

  handleOpen = () => {
    this.setState({ openModal: true });
  };

  handleClose = () => {
    this.setState({ openModal: false });
  };

  loadData = async () => {
    const token = JSON.parse(localStorage.getItem('token'));
    async function loadMetrics() {
      const { data } = await axios.get('http://localhost:1337/metric-units', {
          headers: {
          Authorization: "Bearer " + token.jwt
          },
      });
      console.log(data);
    }
    const { data } = await axios.get('http://localhost:1337/providers', {
        headers: {
        Authorization: "Bearer " + token.jwt
        },
    });
    await loadMetrics();
    const result = data.filter(x => x.user.id === token.user.id)
    let filteredProducts = [];
    console.log(result)
    for (let i = 0; i < result.length; i++)
    {
      filteredProducts = filteredProducts.concat(result[i].products)
    }
    filteredProducts = filteredProducts.filter((elem, pos, arr) => arr.indexOf(elem) == pos);
    this.setState({ cacheProducts: result, products: filteredProducts })
  }

  async componentDidMount() {
      await this.loadData();
  }

  // Продукт | Кількість | Одиниця Виміру |

  generateGrid () {
    const groceryValue = (id) => {
      if (this.state.grocery[id]) {
        const {label, value} = this.state.grocery[id]
        return `${label} (${value})`
      } else {
        return ''
      }
    }
    const component = (id) => {
      return (
        <Select
          autofocus
          openOnFocus
          value={this.state && this.state.grocery[id]}
          onChange={(opt) => this.setState({grocery: _.assign(this.state.grocery, {[id]: opt})})}
          options={this.options}
        />
      )
    }

    let rows = [
      [{readOnly: true, colSpan: 4, value: 'Список замовлень'}],
      [
        {readOnly: true, value: 'Продукт'},
        {readOnly: true, value: "Кількість"},
        {readOnly: true, value: "Одиниця виміру"},
        {readOnly: true, value: "Дія"},
      ]
    ]
    rows = rows.concat(_.range(1, this.state.items + 1).map(id => [
        {readOnly: true, value: `Товар ${id}`}, 
        { value: "Test"  }, 
        { value: groceryValue(id), component: component(id) }, 
        { component: (<Button color="secondary">Видалити</Button>), forceComponent: true }
    ]))
    for (let i = 0; i < this.state.currentProducts.length; i++)
    {
      
    }
    return rows
  }

  appendProduct = () => {
    const productsSelected = this.selectAddPrRef.current.select.getValue();
    if (productsSelected.length)
    {
      const productId = productsSelected[0].value;
      console.log(productId)
      console.log(this.state.products)
      const filtered = this.state.products.filter(x => x.id == productId);
      if (filtered.length && !this.state.currentProducts.filter(x => x.id == productId).length)
      {
        this.setState({ currentProducts: this.state.currentProducts.concat(filtered), openModal: false }, () => {
          console.log(this.state.currentProducts)
        })
      }
    }
  }

  render () {
    return (
        <div id="bkg" style={styles.root}>
            { !this.state.products.length ? (<div>Loading...</div>) :
            (<div>
              <div style={styles.row}>
                <Button onClick={this.handleOpen} variant="contained" color="primary" style={{marginBottom: 10}} >Додати</Button>
                <Button onClick={this.handleOpen} variant="contained" color="secondary" style={{marginBottom: 10}} >Вийти</Button>
              </div>
                <Modal
                open={this.state.openModal}
                onClose={this.handleClose}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description">
                <Card style={{ width: 300, height: "100vh" }}>
                {this.state.products.filter(x => !this.state.currentProducts.filter(y => y.id == x.id).length ).length ? (
                    <CardContent>
                        <p>Оберіть продукт та нажміть на кнопку "Готово"</p>
                        <Select
                            autofocus
                            openOnFocus
                            options={this.state.products.filter(x => !this.state.currentProducts.filter(y => y.id == x.id).length ).map((item) => {
                                return { label: item.ProductName, value: item.id }
                            })}
                            ref={this.selectAddPrRef}
                        />
                        <Button onClick={this.appendProduct} style={{marginTop: 20}} variant="text">Готово</Button>
                    </CardContent>) :
                    (<CardContent>
                      <p>В списку більше нема продуктів</p>
                  </CardContent>)}
                </Card>
            </Modal>
            <div style={styles.tableContainer}>
            <Datasheet
                data={this.generateGrid()}
                valueRenderer={(cell) => cell.value}
                onChange={() => {}}
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
    "overflow-y": "scroll",
    "-webkit-box-shadow": "4px 4px 8px 0px rgba(34, 60, 80, 0.3)",
    "-moz-box-shadow": "4px 4px 8px 0px rgba(34, 60, 80, 0.3)",
    "box-shadow": "4px 4px 8px 0px rgba(34, 60, 80, 0.3)",
  },
  card: {

  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}