import React from "react";
import axios from "axios";
import _ from 'lodash';
import Datasheet from 'react-datasheet';
import moment from "moment";
import { BottomNavigation, BottomNavigationAction, Button, } from "@material-ui/core";
import { ListAltOutlined, HistoryOutlined } from "@material-ui/icons";
import Alert from '@material-ui/lab/Alert';

export default class BasicSheet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            grid: [],
            data: [],
            historyData: [],
            currentIndex: 0,
            pageIndex: 0,
            isFetching: false
        };
    }

    async componentDidMount() {
        await this.loadData();
    }

    generateGridFromData = () => {
        let rows = [
            [{ readOnly: true, colSpan: 6, value: 'Список замовлень' }],
            [
                { readOnly: true, value: 'Дата' },
                { readOnly: true, value: 'Клієнт' },
                { readOnly: true, value: "Адреса" },
                { readOnly: true, value: "Продукт" },
                { readOnly: true, value: "Кількість" },
                { readOnly: true, value: "Постачальник" },
            ]
        ]
        this.state.data.forEach(order => {
            rows = rows.concat([[
                { value: order.date },
                { value: order.userName },
                { value: order.userAdress },
                { value: order.product },
                { value: order.countAndUnit },
                { value: order.provider }
            ]])
        })
        this.setState({ grid: rows })
    }

    approveFinished = async () => {
        if (!window.confirm("Впевнені, що хочете архівувати запис?"))
            return;
        const token = JSON.parse(localStorage.getItem('token'));
        const answer = await axios.post('http://localhost:1337/orders/approve-all', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });
        window.location.reload();
    }

    cancelIt = async () => {
        if (!window.confirm("Впевнені, що хочете відхилити запис?"))
            return;
        const token = JSON.parse(localStorage.getItem('token'));
        const answer = await axios.post('http://localhost:1337/orders/cancel', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });
        window.location.reload();
    }

    loadData = async () => {
        this.setState({ isFetching: true })
        const token = JSON.parse(localStorage.getItem('token'));
        const usersAnswer = await axios.get('http://localhost:1337/users', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });
        const productsAnswer = await axios.get('http://localhost:1337/products', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });

        console.log(usersAnswer.data);
        console.log(productsAnswer.data);

        let data = [];
        let historyData = [];
        const productList = productsAnswer.data;
        for (let i = 0; i < usersAnswer.data.length; i++) {
            const user = usersAnswer.data[i];
            if (user && user.orders && user.orders.length) {
                user.orders.forEach(order => {
                    if (order.data) {
                        order.data.forEach(product => {
                            console.log(order)
                            const productObj = productList.filter(x => x.id == product.product_id)[0]
                            const orderData = {
                                product: productObj ? productObj.ProductName : product.product_id,
                                countAndUnit: product.count + " " + product.unit,
                                userName: user.username,
                                userAdress: user.address,
                                date: moment(order.date).format("DD-MM-YYYY"),
                                provider: productObj && productObj.provider ? productObj.provider.Name : "",
                                providerId: productObj && productObj.provider ? productObj.provider.id : -5,
                            };
                            if (order.finished && order.accepted)
                                historyData.push(orderData);
                            else if (!order.finished && order.accepted)
                                data.push(orderData);
                        })
                    }
                })
            }
        }

        data = data.sort((first, second) => {
            return first.providerId - second.providerId
        })
        historyData = _.groupBy(historyData, 'date')
        let historyDataArr = []
        for (const key in historyData) {
            if (Object.hasOwnProperty.call(historyData, key)) {
                const element = historyData[key];
                historyDataArr.push(element);
            }
        }
        if (!this.fixedData) {
            console.log("new fixed data")
            this.fixedData = data;
        }

        this.setState({ data, historyData: historyDataArr, isFetching: false }, () => {
            this.generateGridFromData()
        })

    }

    nextPage = () => {
        const page = this.state.currentIndex;
        if (page + 1 >= this.state.historyData.length) {
            this.setState({ currentIndex: 0, data: this.state.historyData[0] }, () => {
                this.generateGridFromData();
            })
        } else {
            this.setState({ currentIndex: page + 1, data: this.state.historyData[page + 1] }, () => {
                this.generateGridFromData();
            })
        }
    }

    prevPage = () => {
        const page = this.state.currentIndex;
        if (page - 1 < 0) {
            this.setState({ currentIndex: this.state.historyData.length - 1, data: this.state.historyData[this.state.historyData.length - 1] }, () => {
                this.generateGridFromData();
            })
        } else {
            this.setState({ currentIndex: page - 1, data: this.state.historyData[page - 1] }, () => {
                this.generateGridFromData();
            })
        }
    }

    valueRenderer = cell => cell.value;

    onContextMenu = (e, cell, i, j) =>
        cell.readOnly ? e.preventDefault() : null;

    render() {
        return (
            <div style={styles.root}>
                { this.state.isFetching ? (<Alert severity="info">Зачейкайте, будь ласка! Завантаження...</Alert>) :
                    (
                        <div>
                            { this.state.pageIndex ? 
                            (<div>
                                <div style={styles.row}>
                                    <Button onClick={this.prevPage} variant="contained" color="default">Назад</Button>
                                    <BottomNavigation
                                        value={this.state.pageIndex}
                                        onChange={(event, newValue) => {
                                            this.setState({ pageIndex: newValue,
                                                data: this.fixedData,
                                                currentIndex: 0 }, () => {
                                                    this.generateGridFromData();
                                                })
                                        }}
                                        showLabels
                                    >
                                        <BottomNavigationAction label="Замовлення" icon={<ListAltOutlined />} />
                                        <BottomNavigationAction label="Історія" icon={<HistoryOutlined />} />
                                    </BottomNavigation>
                                    <Button onClick={this.nextPage} variant="contained" color="default">Вперед</Button>
                                </div>
                                <div style={styles.tableContainer}>
                                    <Datasheet
                                        data={this.state.grid}
                                        valueRenderer={this.valueRenderer}
                                        onContextMenu={this.onContextMenu}
                                        onCellsChanged={this.onCellsChanged} />

                                </div>
                            </div>) 
                            :
                            (<div>
                                <div style={styles.row}>
                                    <Button onClick={this.approveFinished} variant="contained" color="primary">Підтвердити</Button>
                                    <BottomNavigation
                                        value={this.state.pageIndex}
                                        onChange={(event, newValue) => {
                                            if (this.state.historyData.length)
                                            {
                                                console.log(this.state.historyData[0])
                                                this.setState({ pageIndex: newValue, data: this.state.historyData[0], currentIndex: 0 }, () => {
                                                    this.generateGridFromData();
                                                })
                                            }
                                            else {
                                                this.setState({ data: [],  currentIndex: 0, pageIndex: newValue  }, () => {
                                                    this.generateGridFromData()
                                                })
                                            }
                                        }}
                                        showLabels
                                    >
                                        <BottomNavigationAction label="Замовлення" icon={<ListAltOutlined />} />
                                        <BottomNavigationAction label="Історія" icon={<HistoryOutlined />} />
                                    </BottomNavigation>
                                    <Button onClick={this.cancelIt} variant="contained" color="secondary">Відхилити</Button>
                                </div>
                                <div style={styles.tableContainer}>
                                    <Datasheet
                                        data={this.state.grid}
                                        valueRenderer={this.valueRenderer}
                                        onContextMenu={this.onContextMenu}
                                        onCellsChanged={this.onCellsChanged} />

                                </div>
                            </div>)}
                        </div>)}
            </div>
        );
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
        minHeight: '55vh',
        overflowY: "scroll",
        boxShadow: "4px 4px 8px 0px rgba(34, 60, 80, 0.3)",
        marginTop: 10
    },
    card: {

    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
}