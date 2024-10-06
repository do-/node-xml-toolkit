module.exports = {
	"ExportDebtRequestsResponse": {	
	  "request-data": {
		"request-id": "bac4c940-6ad3-11eb-9439-0242ac130002",
		"request-number": "022021173",
		"applicant-info": {
		  "firstname": "Иван",
		  "lastname": "Иванов",
		  "middlename": "Иванович",
		  "snils": "11111111145",
		  "document": {
			"type": "1",
			"series": "1234",
			"number": "123456"
		  }
		},
		"housing-fund-object": {
		  "house-id": "e786b770-28e6-4557-8dde-86e8e347587e",
		  "address-details": "кв. 27",
		  "fias-house-id": "497cdeef-0388-466b-a063-36f51d94800c",
		  "address": "153045, Ивановская обл, г. Иваново, ул. 3 Июня, д. 14"
		},
		"period": {
		  "start-date": "2018-02-01",
		  "end-date": new Date ()
		},
		"organization": {
		  "organization-root-id": "6eef689e-48bb-4eb0-9c11-18b6db9909b7",
		  "name": "Администрация г. Иваново",
		  "tel": "+7(4932)32-80-83"
		},
		"executor-info": {
		  "id": "84b12e02-6ad8-11eb-9439-0242ac130002",
		  "fio": "Четвертак Иван Иванович"
		},
		"status": "PROCESSED",
		"result": 4,
		"creation-date": "2021-02-04",
		"sent-date": "2021-02-04",
		"response-date": "2021-02-08",
		"subrequest": {
		  "organization": {
			"organization-root-id": "ad50290c-6ad9-11eb-9439-0242ac130002",
			"name": "УК ООО \"ГУЖФ\"",
			"tel": "8-800-200-50-58"
		  },
		  "response": {
			"type": "PROVIDED",
			"has-debt": true,
			"debt-info": [
			  {
				"person": {
				  "firstname": "Петр",
				  "lastname": "Петров",
				  "middlename": "Петрович",
				  "snils": "11111111146",
				  "document": {
					"type": "1",
					"series": "1235",
					"number": "123455"
				  }
				}
			  },
			  {
				"person": {
				  "firstname": "Сидор",
				  "lastname": "Сидоров",
				  "middlename": "Сидорович",
				  "snils": "11111111146",
				  "document": {
					"type": "1",
					"series": "1235",
					"number": "123455"
				  }
				}
			  }
			],
			"executor-info": {
			  "id": "38a794b8-6ada-11eb-9439-0242ac130002",
			  "fio": "Герасимова Ольга Ивановна"
			}
		  }
		}
	  }
	}
  }