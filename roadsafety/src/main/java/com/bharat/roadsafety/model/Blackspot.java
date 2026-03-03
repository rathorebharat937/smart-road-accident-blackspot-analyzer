package com.bharat.roadsafety.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Blackspot {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private Integer totalAccidents;
    private Integer nightAccidents;
    private Integer rainAccidents;
    private Double ari;
    private String riskLevel;
    private Integer deaths;
    private Integer injured;
    private String roadType;

}
