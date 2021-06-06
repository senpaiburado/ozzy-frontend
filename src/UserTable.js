import React from 'react'
import Select from 'react-select'
import _ from 'lodash'
import Datasheet from 'react-datasheet'
import axios from "axios";
import { Button, Card, CardContent, Modal } from '@material-ui/core';

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
      items: 3,
      openModal: false,
      products: []
    }
  };

  handleOpen = () => {
    this.setState({ openModal: true });
  };

  handleClose = () => {
    this.setState({ openModal: false });
  };

  loadData = async () => {
    const token = JSON.parse(localStorage.getItem('token'));
    console.log(token.jwt);
    const { data } = await axios.get('http://localhost:1337/products', {
        headers: {
        Authorization: "Bearer " + token.jwt
        },
    });
    this.setState({ products: data })
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
    console.log(rows)
    return rows
  }

  render () {
    return (
        <div>
            { !this.state.products.length ? (<div>Loading...</div>) :
            (<div>
                <Button onClick={this.handleOpen}>Додати</Button>
                <Modal
                open={this.state.openModal}
                onClose={this.handleClose}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description">
                <Card style={{ width: 300, height: "100vh" }}>
                    <CardContent>
                        <p>Оберіть продукт та нажміть на кнопку "Готово"</p>
                        {console.log(this.state.products[0])}
                        <Select
                            autofocus
                            openOnFocus
                            defaultValue={{label: this.state.products[0].ProductName, value: this.state.products[0].id }}
                            // onChange={(opt) => this.setState({grocery: _.assign(this.state.grocery, {[id]: opt})})}
                            options={this.state.products.map((item) => {
                                return { label: item.ProductName, value: item.id }
                            })}
                        />
                        <Button style={{marginTop: 20}} variant="text">Готово</Button>
                    </CardContent>
                </Card>
            </Modal>
            <Datasheet
                data={this.generateGrid()}
                valueRenderer={(cell) => cell.value}
                onChange={() => {}}
            /></div>)}
      </div>
    )
  }
}

const styles = {
    card: {

    }
}