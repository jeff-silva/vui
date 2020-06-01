Vue.component("vui-address", {
    props: {
        value: {default: () => ({})},
    },

    data() {
        return {
            loading: false,
            props: {
                value: Object.assign({}, {
                    route: "",
                    number: "",
                    complement: "",
                    zipcode: "",
                    district: "",
                    city: "",
                    state: "",
                    state_code: "",
                    country: "",
                    country_code: "",
                    formatted: "",
                    lat: "",
                    lng: "",
                }, this.value),
            },
        };
    },

    methods: {
        ajax(method, url, post) {
            var xhr = new XMLHttpRequest();
            return new Promise((resolve, reject) => {
                xhr.onreadystatechange = function() {
                    if (xhr.readyState !== 4) return;
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.response));
                    }
                    else { reject({status: xhr.status, statusText: xhr.statusText}); }
                };
                xhr.open(method, url, true);
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr.send(JSON.stringify(post||{}));
            });
        },


        getAddressByZip() {
            if (this.props.value.zipcode.length<8) return;
            if (this.getAddressByZipTimeout) clearTimeout(this.getAddressByZipTimeout);

            this.loading = true;
            this.getAddressByZipTimeout = setTimeout(() => {
                this.ajax('GET', `https://viacep.com.br/ws/${this.props.value.zipcode.replace(/[^0-9]/g, '')}/json/`).then((resp) => {
                    this.loading = false;
                    var locales = {"AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas", "BA": "Bahia", "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás", "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul", "MG": "Minas Gerais", "PA": "Pará", "PB": "Paraíba", "PR": "Paraná", "PE": "Pernambuco", "PI": "Piauí", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte", "RS": "Rio Grande do Sul", "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina", "SP": "São Paulo", "SE": "Sergipe", "TO": "Tocantins"};
                    
                    if (locales[resp.uf]) {
                        this.props.value.state_code = resp.uf;
                        this.props.value.state = locales[resp.uf];
                        this.props.value.country = "Brasil";
                        this.props.value.country_code = "BR";
                    }

                    this.props.value.district = resp.bairro;
                    this.props.value.zipcode = resp.cep;
                    this.props.value.city = resp.localidade;
                    this.props.value.city = resp.localidade;
                    this.props.value.route = resp.logradouro;

                    this.formatAddress();
                    this.getLatLngFromAddress();
                });
            }, 500);
        },


        getLatLngFromAddress() {
            if (this.getLatLngFromAddressTimeout) clearTimeout(this.getLatLngFromAddressTimeout);
            this.getLatLngFromAddressTimeout = setTimeout(() => {
                this.ajax('GET', `https://nominatim.openstreetmap.org/search?format=json&q=${this.props.value.formatted}`).then((resp) => {
                    this.props.value.lat = resp[0]? resp[0].lat: '';
                    this.props.value.lng = resp[0]? resp[0].lon: '';
                });
            }, 500);
        },


        getAddressByLatLng(addr) {
            if (this.getAddressByLatLngTimeout) clearTimeout(this.getAddressByLatLngTimeout);
            getAddressByLatLngTimeout = setTimeout(() => {
                this.ajax('GET', `https://nominatim.openstreetmap.org/reverse?format=json&lat=${addr.lat}&lon=${addr.lng}`).then((resp) => {
                    this.props.value.city = resp.address.city;
                    this.props.value.country_code = resp.address.country_code;
                    this.props.value.number = resp.address.house_number;
                    this.props.value.district = resp.address.suburb;
                    this.props.value.zipcode = resp.address.postcode;
                    this.props.value.route = resp.address.road;
                    this.props.value.state = resp.address.state;
                    this.props.value.lat = addr.lat;
                    this.props.value.lng = addr.lng;
                    this.formatAddress();
                });
            }, 500);
        },


        formatAddress() {
            var addr = [];

            ['route', 'number', 'complement', 'district', 'city', 'state_short'].forEach((key) => {
                if (this.props.value[key]) {
                    addr.push(this.props.value[key]);
                }
            });

            this.props.value.formatted = addr.join(', ');
            this.emit(this.props.value);
        },

        emit(value) {
            this.value = value;
            this.$emit('input', this.value);
            this.$emit('value', this.value);
            this.$emit('change', this.value);
        },
    },

    template: `<div>
        <div class="row">
            <div class="form-group col-6">
                <div class="input-group">
                    <input type="text"
                        class="form-control"
                        placeholder="CEP"
                        v-mask="'#####-###'"
                        v-model="props.value.zipcode"
                        @keyup="getAddressByZip();"
                    />
                    <div class="input-group-btn">
                        <button type="button" class="btn btn-primary" @click="getAddressByZip();">
                            <i class="fa fa-fw fa-spin fa-spinner" v-if="loading"></i>
                            <i class="fa fa-fw fa-search" v-else></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="col-12"></div>
            <div class="form-group col-12 col-md-8"><input type="text" class="form-control" @keyup="formatAddress();" placeholder="Rua" v-model="props.value.route" /></div>
            <div class="form-group col-6 col-md-4"><input type="text" class="form-control" @keyup="formatAddress(); getLatLngFromAddress();" placeholder="Nº" v-model="props.value.number" /></div>
            <div class="form-group col-6 col-md-6"><input type="text" class="form-control" @keyup="formatAddress();" placeholder="Complemento" v-model="props.value.complement" /></div>
            <div class="form-group col-6 col-md-6"><input type="text" class="form-control" @keyup="formatAddress();" placeholder="Bairro" v-model="props.value.district" /></div>
            <div class="form-group col-6 col-md-4"><input type="text" class="form-control" @keyup="formatAddress();" placeholder="Cidade" v-model="props.value.city" /></div>
            <div class="form-group col-6 col-md-4"><input type="text" class="form-control" @keyup="formatAddress();" placeholder="Estado" v-model="props.value.state" /></div>
            <div class="form-group col-6 col-md-4"><input type="text" class="form-control" @keyup="formatAddress();" placeholder="País" v-model="props.value.country" /></div>
            <div class="col-12" v-if="props.value.lat && props.value.lng">
                <l-map style="width:100%; height:300px;" :zoom="14" :center="[props.value.lat, props.value.lng]">
                    <l-tile-layer :url="'//{s}.tile.osm.org/{z}/{x}/{y}.png'"></l-tile-layer>

                    <l-control position="bottomleft" >
                        <div style="max-width:400px; background:#ffffff44;">
                            {{ props.value.formatted }}
                        </div>
                    </l-control>

                    <l-marker :lat-lng="[props.value.lat, props.value.lng]" :draggable="true" @update:lat-lng="getAddressByLatLng($event);">
                        <l-tooltip :content="props.value.formatted" />
                    </l-marker>
                </l-map>

            </div>
        </div>
    </div>`,
});