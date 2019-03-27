import React,{ Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { proxy } from '../../package.json';
import $ from 'jquery';
export class Add extends Component {
  constructor(props) {
    super(props);
    this.error = false;
    this.noOfFeatures = 0;
    this.noOfTechDetail = 0;
    this.features_html = [];
    this.state ={
      files : [],
      images : [],
      thumb_image : '/logo.png',
      features_html: {},
      name: '',
      techdetail : {},
      techdetail_html : {},
      warranty : '',
      original_price : 0.00,
      discounted_price : 0.00,
      features : {},
      user: null,
      message: {},
      preview: false
    };
    this.inputStyle = {
      backgroundColor: "transparent",
      border: "0px solid",
      color: "#6C6D6F",
      minWidth: "80%"
    }
    this. _token = '';
    $.ajax({
            type: "GET",
            url: "api/addproduct",
            async:false,
            success: (data) => {
               this._token = data._token;
            },
            error: () => {
               alert('error');
            }
        });
    this.onChange = this.onChange.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.handleInput = this.handleInput.bind(this);
  }
  addFeature = () => {
    this.noOfFeatures += 1;
    var key = this.noOfFeatures;
    var html = (
      <div key ={key} className="list-group-item list-group-item-action flex-column align-items-start">
      <div className="d-flex w-100 justify-content-between">
        <h5 className="mb-1"><input name={"heading"} style={this.inputStyle} onChange={this.handleFeature.bind(this,key)} placeholder="Feature Heading"/></h5>
          <button onClick={this.removeFeature.bind(this,key)} type="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
      </div>
      <p className="mb-1"><input name={"feature"} style={this.inputStyle} onChange={this.handleFeature.bind(this,key)} placeholder="Feature Discription"/></p>
      </div>
    );
    var fh = this.state.features_html;
    var skeleton = {
      heading : '',
      feature : ''
    }
    var features = this.state.features;
    fh[key] = html;
    features[key] = skeleton;
    this.setState({
      features_html : fh,
      features: features
    })
  }
  addTechDetail = () => {
    this.noOfTechDetail += 1;
    var key = this.noOfTechDetail;
    var html = (
      <tr key={key}>
        <th scope="row"><input onChange={this.handleTechDetail.bind(this,key)} name="head" style={this.inputStyle} placeholder="Type"/></th>
        <td><input onChange={this.handleTechDetail.bind(this,key)} name="tail" style={this.inputStyle} placeholder="Name"/></td>
        <button onClick={this.removeTechDetail.bind(this,key)} type="button" className="close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </tr>
    )
    let th = this.state.techdetail_html;
    let td = this.state.techdetail;
    th[key] = html;
    var skeleton = {
      head : '',
      tail : ''
    }
    td[key] = skeleton;
    this.setState({
      techdetail: td,
      techdetail_html: th
    })
  }
  handleInput = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }
  handleFeature = (key,e) => {
    var name = e.target.name
    var features = this.state.features;
    features[key][e.target.name] = e.target.value;
    this.setState({
      features :features
    })
  }
  handleTechDetail = (key,e) => {
    var name = e.target.name
    var techdetail = this.state.techdetail;
    techdetail[key][e.target.name] = e.target.value;
    this.setState({
      techdetail :techdetail
    })
  }
  removeFeature = (key) => {
    var features = this.state.features;
    var features_html = this.state.features_html;
    delete features_html[key];
    delete features[key];
    this.setState({
      features: features,
      features_html: features_html
    });
  }
  removeTechDetail = (key) => {
    var techdetail = this.state.techdetail;
    var techdetail_html = this.state.techdetail_html;
    delete techdetail_html[key];
    delete techdetail[key];
    this.setState({
      techdetail: techdetail,
      techdetail_html: techdetail_html
    });
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
  }
  onFormSubmit(e){
        e.preventDefault();
        this.setState({message:{
          success:"uploading"
        }})
        var formData = new FormData();
        var features = [];
        var techDetail = [];
        for(var feat in this.state.features) {
          features.push(this.state.features[feat])
        }
        for(var det in this.state.techdetail) {
          techDetail.push(this.state.techdetail[det])
        }
        formData.append('_csrf',this._token);
        for(var file of this.state.files) {
          formData.append('Images',file);
        }
        formData.append('original_price',this.state.original_price);
        formData.append('discounted_price',this.state.discounted_price);
        formData.append('features',JSON.stringify(features));
        formData.append('techDetail',JSON.stringify(techDetail));
        formData.append('warranty',this.state.warranty);
        formData.append('name',this.state.name);
        $.ajax({
            type: "POST",
            url: "api/addproduct",
            processData: false,
            contentType: false,
            cache: false,
            enctype: 'multipart/form-data',
            data: formData,
            success: (response) => {
              this.setState({message: response.messages});
            },
            error: (e) => {
              this.setState({message: e.responseJSON.messages});
            }
        });
    }
    onChange(e) {
      var thumb_image = URL.createObjectURL(e.target.files[0]);
      var images = []
      for(var i = 1; i<e.target.files.length;i++) {
        images.push(URL.createObjectURL(e.target.files[i]));
      }
      this.setState({
        files:e.target.files,
        images : images,
        thumb_image: thumb_image
      });
    }
  render() {
    let info = '';
    var features = [];
    var techDetail = [];
    var images = [];
    for(var i in this.state.images) {
      images.push((
        <img key={i} src={this.state.images[i]} alt="" className="thumbnail small"/>
      ))
    }
    for( let i in this.state.features_html) {
      features.push(this.state.features_html[i]);
    }
    for( let i in this.state.techdetail_html) {
      techDetail.push(this.state.techdetail_html[i]);
    }
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
      return (
          <div >
            <div className="jumbotron jumbotron-fluid">
              <div className="container">
                <h1 className="display-4"><input name="name" style={this.inputStyle} onChange={this.handleInput} placeholder="Product Name"/></h1>
              </div>
            </div>
              <div className="container-fluid">
                <div className="row">
                  <div className="col-lg-6 col-sm-11 mx-auto">
                    <div className="text-left margin">
                      {images}
                    </div>
                    <div className="thumbnail">
                      <img src={this.state.thumb_image} alt="" className="img-responsive rounded mx-auto d-block"/>
                    </div>
                    <br/>
                    <div className="custom-file" id="customFile" lang="es">
                      <input onChange= {this.onChange} type="file" multiple className="custom-file-input" aria-describedby="upload images"/>
                      <label className="custom-file-label">
                         Select images...
                      </label>
                    </div>
                  </div>
                    <div className="col-lg-6 col-sm-12 mx-auto">
                      <div className="container padding">
                        <div className="col">
                          <div className="row">
                            <div className="col mini-box">
                              <div className="padding col mini-box">
                                <span>M.R.P: ₹ </span><p className="line-through"><input name="original_price" style={this.inputStyle} onChange={this.handleInput} placeholder="M.R.P"/></p>
                                <p>Our Price: ₹ <input name="discounted_price" style={this.inputStyle} onChange={this.handleInput} placeholder="Discounted Price"/></p>
                              </div>
                            </div>
                            <div className="padding col mini-box">
                              <button onClick={this.onFormSubmit} type="button" name="button" className="col btn btn-warning">Add Product <i className="fas fa-shopping-cart"></i></button>
                              {info['messages']}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="list-group">
                        <div className="list-group-item list-group-item-action flex-column align-items-start">
                          {features}
                        <button onClick={this.addFeature} style={{border: "0px"}} className="btn btn-block btn-success">Add Feature</button>
                      </div>
                    </div>
                </div>
                </div>
                <br/>
                <hr/>
                <div className="container-fluid">
                  <div className="row">
                    <div className="col col-sm-6">
                      <h6>Technical Details</h6>
                      <table className="table table-striped table-sm table-hover">
                        {techDetail}
                      </table>
                      <button onClick={this.addTechDetail} className="btn btn-block btn-success">Add Tech Detail</button>
                    </div>
                    <div className="col col-sm-6">
                      <h6>Warranty & Support</h6>
                      <hr/>
                      <strong>Warrenty : </strong>  <input name="warranty" style={this.inputStyle} onChange={this.handleInput} placeholder="details"/>
                    </div>
                  </div>
                </div>
                <hr/>
            </div>
          </div>
      );
    } else {
      return (
          <div classNameName="container">
            <br/>
              <div classNameName="alert alert-danger">
                <strong>Unauthorized acces</strong>
              </div>
              <div classNameName="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
                <div classNameName="btn-group mr-2" role="group" aria-label="First group">
                  <Link to="/signup" classNameName='btn btn-primary btn-lg'>SIGN UP</Link>
                  <Link to="/login" classNameName='btn btn-primary btn-lg'>LOG IN</Link>
                </div>
              </div>
          </div>
      );
    }

  }
};
