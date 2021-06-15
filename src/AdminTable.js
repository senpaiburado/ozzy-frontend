import React, { useState } from "react";
import axios from "axios";
import _ from 'lodash';
import Datasheet from 'react-datasheet';
import moment from "moment";
import { BottomNavigation, BottomNavigationAction, Button, Paper, Select, InputLabel, FormControl, MenuItem,
        List, ListItem, Checkbox, ListItemIcon, ListItemText, Modal } from "@material-ui/core";
import { ListAltOutlined, HistoryOutlined, PersonOutlineSharp } from "@material-ui/icons";
import Alert from '@material-ui/lab/Alert';
import ExcelJS from "exceljs/dist/es5/exceljs.browser";
import saveAs from "file-saver";

function createExcel(data) {
    console.log(data)

    var ExcelJSWorkbook = new ExcelJS.Workbook();
    var worksheet = ExcelJSWorkbook.addWorksheet("ExcelJS sheet");

    worksheet.mergeCells("A1:D1");
    worksheet.mergeCells("A2:D2");

    const timeCell = worksheet.getCell("A1");
    timeCell.font = {
      size: 20,
    };
    timeCell.alignment = { vertical: 'middle', horizontal: 'center' }
    timeCell.value = moment().format("DD.MM.YYYY");

    const titleCell = worksheet.getCell("A2");
    titleCell.font = {
      size: 20,
      bold: true
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    titleCell.value = data[0].providerName;

    worksheet.getCell("A3").value = "Назва закладу"
    worksheet.getCell("B3").value = "Назва товару"
    worksheet.getCell("C3").value = "К-сть"
    worksheet.getCell("D3").value = "Од. виміру"

    let index = 4;

    data.forEach(user => {
        const userCell = worksheet.getCell("A" + String(index));
        userCell.value = user.name;
        index++;

        user.products.forEach(product => {
            worksheet.getCell("B" + String(index)).value = product.product
            worksheet.getCell("C" + String(index)).value = ( product.cu && product.cu.split(' ').length > 0 ? product.cu.split(' ')[0] : "" )
            worksheet.getCell("D" + String(index)).value = ( product.cu && product.cu.split(' ').length > 0 ? product.cu.split(' ')[1] : "" )
            index++;
        })
    })

    ExcelJSWorkbook.xlsx.writeBuffer().then(function(buffer) {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          `report.xlsx`
        );
      });
}

function ExportModal(props) {

    const [selectedProviderId, setSelectedProviderId] = useState(1);

    const [checked, setChecked] = React.useState([0]);

    const handleToggle = (value) => () => {
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
        newChecked.push(value);
        } else {
        newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    let providers = [];
    if (props.data && props.data.length) {
        props.data.forEach(item => {
            if (!providers.filter(x => x.id == item.providerId).length)
            {
                providers.push({ name: item.provider, id: item.providerId })
            }
        })
    }

    console.log(providers)

    let users = [];
    console.log(props.data)
    if (props.data && props.data.length) {
        props.data.forEach(item => {
            if (!users.filter(x => x.id == item.userId && x.providerId == item.providerId).length)
            {
                users.push({
                    id: item.userId,
                    name: item.userName,
                    products: props.data.filter(x => x.userId == item.userId && x.providerId == item.providerId).map(y => ({ product: y.product, cu: y.countAndUnit})),
                    providerId: item.providerId,
                    providerName: item.provider
                })
            }
        })
        console.log(users)
    }

    return (
        <Paper>
            <FormControl variant="outlined">
            {/* <InputLabel id="demo-simple-select-outlined-label">Age</InputLabel> */}
                <Select
                labelId="demo-simple-select-outlined-label"
                id="-1"
                value={selectedProviderId}
                onChange={(item) => { console.log(item); setSelectedProviderId(item.target.value) }}
                label="Постачальник"
                >
                    <MenuItem value={-1}>
                        <em>Не обрано</em>
                    </MenuItem>
                    { providers.map(item => {
                        return <MenuItem value={item.id}>{item.name}</MenuItem>
                    }) }
                </Select>
            </FormControl>

            { users.filter(x => x.providerId == selectedProviderId).length > 0 ? (
            <div>
                <List>
                {users.filter(x => x.providerId == selectedProviderId).map((value) => {
                    const labelId = `checkbox-list-label-${value.id}`;

                    return (
                    <ListItem key={value} role={undefined} dense button onClick={handleToggle(value.id)}>
                        <ListItemIcon>
                        <Checkbox
                            edge="start"
                            checked={checked.indexOf(value.id) !== -1}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{ 'aria-labelledby': labelId }}
                        />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={`${value.name}`} />
                    </ListItem>
                    );
                })}
                </List>

                { users.filter(x => checked.includes(x.id) && x.providerId == selectedProviderId).length ? (
                    <Button onClick={() => { createExcel(users.filter(x => checked.includes(x.id) && x.providerId == selectedProviderId)) }}>Сформувати</Button>
                ) : <></>}
            </div>) : <></> }
        </Paper>
    )
}

export default class BasicSheet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            grid: [],
            data: [],
            historyData: [],
            currentIndex: 0,
            pageIndex: 0,
            isFetching: false,
            providers: [],
            users: [],
            isModalOpen: false
        };
    }

    handleModal(value) {
        this.setState({ isModalOpen: value })
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
        const answer = await axios.post('http://23.100.51.147:1337/orders/approve-all', {
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
        const answer = await axios.post('http://23.100.51.147:1337/orders/cancel', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });
        window.location.reload();
    }

    loadData = async () => {
        this.setState({ isFetching: true })
        const token = JSON.parse(localStorage.getItem('token'));
        const usersAnswer = await axios.get('http://23.100.51.147:1337/users', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });
        const productsAnswer = await axios.get('http://23.100.51.147:1337/products', {
            headers: {
                Authorization: "Bearer " + token.jwt
            },
        });

        const providersAnswer = await axios.get('http://23.100.51.147:1337/providers', {
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
                                userId: user.id,
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
                <Modal
                style={{ top: "45%", left: "40%", width: 450, minHeight: 150 }}
                open={this.state.isModalOpen}
                onClose={() => { this.handleModal(false) }}
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
            >
                <ExportModal data={this.state.data} />
            </Modal>
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
                                    <div style={styles.row}>
                                    <Button style={{marginRight: 10}} onClick={this.approveFinished} variant="contained" color="primary">Підтвердити</Button>
                                    <Button onClick={() => { this.handleModal(true) }} variant="contained" color="primary">Сформувати звіт</Button>
                                    </div>
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