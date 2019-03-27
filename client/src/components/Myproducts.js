import React,{ Component,Fragment } from 'react';
import $ from 'jquery';
export class Myproducts extends Component {
  constructor(props) {
    super(props);
    this.error = false;
    this.state ={
      user: {},
      products: {},
      message: {}
    };
  }
  componentWillMount() {
    $.ajax({
            type: "GET",
            url: "user/api/user",
            async:false,
            success: (data) => {
              this.setState({
                user : data.user
              })
            },
            error: () => {
              this.error = true;
            }
        });
    $.ajax({
            type: "GET",
            url: "/api/products",
            async:true,
            success: (data) => {
              this.setState({
                products: data.products
              })
            },
            error: () => {
              this.error = true;
            }
        });
  }
  pushProduct = (id,product,products) => {
    var features = []
    for( let i in product.features) {
      features.push(<li key={'features-'+i+'-'+ id} ><i className="fa fa-chevron-circle-right"></i>{product.features[i]}</li>);
    }
    var html = (
      <div key={'key-' + id} className="row">
        <div className="card col-sm-12">
          <div className="row">
            <div className="col-sm-2 col-xs-8">
              <img className="card-img-top" src={product.image} />
            </div>
            <div className="col-sm-6 col-xs-10 pull-left">
              <h2>{product.name}</h2>
                <ul className="fa-ul">
                  {features}
                </ul>
            </div>
            <div className="col-sm-2 col-xs-2 ">
              <br/>
              <p style={{textDecoration: "line-through"}}><i className="fa fa-inr"></i> {product.original_price}</p>
              <p><i className="fa fa-inr"></i> {product.discounted_price}</p>
              <Link style={{borderRadius: "10px"}} className="btn btn-primary" to={"/client/productinfo/"+id}><i className="fa fa-info"></i> More Info</Link>
              <br/>
              <br/>
              <button className="btn btn-warning" style={{borderRadius: "10px"}}><i className="fa fa-shopping-cart"></i> More Info!</button>
            </div>
          </div>
        </div>
      </div>
    )
    products.push((id,html));
  }
  render() {
    let info = '';
    if( this.state.message && !(Object.keys(this.state.message).length === 0) ) {
      var type = Object.keys(this.state.message)[0];
      info = {
        messages: (
          <Fragment>
            <div className={"alert alert-"+type}>
              <strong>{this.state.message[type]}</strong>
            </div>
          </Fragment>
        )
      }
    }
    if(!this.error && this.state.user) {
      var products = [];
      for (let [key, value] of Object.entries(this.state.products)) {
          this.pushProduct(key,value,products)
      }
      return (
        <div className="container">
          {products}
        </div>
      );
    } else {
      return (
          <div className="container">
            <br/>
              <div className="alert alert-danger">
                <strong>Unauthorized acces</strong>
              </div>
              <div className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                <div className="btn-group mr-2" role="group" aria-label="First group">
                  <Link to="/signup" className='btn btn-primary btn-lg'>SIGN UP</Link>
                  <Link to="/login" className='btn btn-primary btn-lg'>LOG IN</Link>
                </div>
              </div>
          </div>
      );
    }

  }
};
